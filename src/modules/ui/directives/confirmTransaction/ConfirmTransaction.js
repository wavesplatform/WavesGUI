/* eslint-disable no-console */
(function () {
    'use strict';

    /**
     * @param Base
     * @param {Waves} waves
     * @param $attrs
     * @param {$mdDialog} $mdDialog
     * @param {ModalManager} modalManager
     * @param {User} user
     * @param {$rootScope.Scope} $scope
     * @param {app.utils} utils
     * @param {ValidateService} validateService
     * @returns {ConfirmTransaction}
     */
    const controller = function (Base, waves, $attrs, $mdDialog, modalManager, user, $scope, utils, validateService) {

        const ds = require('data-service');
        const { Money } = require('@waves/data-entities');
        const { TRANSACTION_TYPE_NUMBER } = require('@waves/signature-adapter');

        class ConfirmTransaction extends Base {

            constructor() {
                super();
                /**
                 * @type {function}
                 */
                this.onTxSent = null;
                /**
                 * @type {*|string}
                 */
                this.locale = $attrs.locale || 'app.ui';
                /**
                 * @type {number}
                 */
                this.step = 0;
                /**
                 * @type {boolean}
                 */
                this.showValidationErrors = false;
                /**
                 * @type {Array}
                 */
                this.errors = [];

                /**
                 * @type {object}
                 */
                this.preparedTx = null;
                /**
                 * @type {string}
                 */
                this.txId = '';
                /**
                 * @type {string}
                 */
                this.type = user.userType;
                /**
                 * @type {boolean}
                 */
                this.loadingSignFromDevice = false;
                /**
                 * @type {boolean}
                 */
                this.deviceSignFail = false;
                /**
                 * @type {Signable}
                 * @private
                 */
                this._signable = null;
                /**
                 * @type {boolean}
                 */
                this.has2fa = false;
                /**
                 * @type {string}
                 */
                this.code2fa = '';

                ds.fetch(`https://localhost:8081/is-available/${user.address}`).then(response => {
                    this.has2fa = !response.status;
                    $scope.$digest();
                });

                this.observe('tx', this._onChangeTx);
                this.observe('code2fa', this._onChange2faCode);
                this.observe('showValidationErrors', this._showErrors);
            }

            /**
             * @return {boolean}
             */
            canSignFromDevice() {
                return this.type && this.type !== 'seed' || false;
            }

            /**
             * @return {Promise<string>}
             */
            getTxId() {
                return this._signable.getId();
            }

            signTx() {
                this.loadingSignFromDevice = this.canSignFromDevice();
                return this._signable.getDataForApi();
            }

            getTxData() {
                this.getTxId()
                    .then(() => {
                        this.loadingSignFromDevice = this.canSignFromDevice();
                        $scope.$digest();
                        return this.signTx();
                    })
                    .then(preparedTx => {
                        this.preparedTx = preparedTx;

                        if (this.canSignFromDevice()) {
                            this.confirm();
                        }
                    })
                    .catch(() => {
                        this.loadingSignFromDevice = false;
                        $scope.$digest();
                    });
            }

            trySign() {
                return this.getTxData();
            }

            $postLink() {
                this.trySign();
            }

            confirm() {
                return this.sendTransaction().then(({ id }) => {
                    this.tx.id = id;
                    this.step++;
                    this.onTxSent({ id });
                    $scope.$apply();
                }).catch((e) => {
                    this.loadingSignFromDevice = false;
                    console.error(e);
                    console.error('Transaction error!');
                    $scope.$apply();
                });
            }

            showTxInfo() {
                $mdDialog.hide();
                setTimeout(() => { // Timeout for routing (if modal has route)
                    modalManager.showTransactionInfo(this.tx.id);
                }, 1000);
            }

            sendTransaction() {
                const txType = ConfirmTransaction.upFirstChar(this.tx.transactionType);
                const amount = ConfirmTransaction.toBigNumber(this.tx.amount);

                return ds.broadcast(this.preparedTx).then((data) => {
                    analytics.push(
                        'Transaction', `Transaction.${txType}.${WavesApp.type}`,
                        `Transaction.${txType}.${WavesApp.type}.Success`, amount
                    );
                    return data;
                }, (error) => {
                    analytics.push(
                        'Transaction', `Transaction.${txType}.${WavesApp.type}`,
                        `Transaction.${txType}.${WavesApp.type}.Error`, amount
                    );
                    return Promise.reject(error);
                });
            }

            /**
             * @private
             */
            _onChangeTx() {
                const timestamp = ds.utils.normalizeTime(this.tx.timestamp || Date.now());
                const data = { ...this.tx, timestamp };
                const type = this.tx.type;

                this._signable = ds.signature.getSignatureApi()
                    .makeSignable({ type, data });

                this._signable.getId().then(id => {
                    this.txId = id;
                    $scope.$digest();
                });
            }

            _onChange2faCode() {
                const code = this.code2fa;
                const { create, getClassName } = require('instance-transfer');
                const stringify = create({
                    jsonStringify: WavesApp.stringifyJSON,
                    classes: [
                        {
                            name: getClassName(Money),
                            stringify: (item) => {
                                const asset = item.asset.toJSON();
                                const coins = item.toCoins();

                                return { asset, coins };
                            }
                        }
                    ]
                }).stringify;

                if (code.trim().length === 6) {
                    this._signable.sign2fa({
                        code,
                        request: (data) => ds.fetch('https://localhost:8081/sign', {
                            method: 'POST',
                            body: stringify(data)
                        }).then(({ signature }) => signature)
                    });
                }
            }

            /**
             * @private
             */
            _showErrors() {
                if (this.showValidationErrors) {
                    if (this.tx.transactionType === TRANSACTION_TYPE_NUMBER.TRANSFER) {
                        const errors = [];
                        Promise.all([
                            waves.node.assets.userBalances()
                                .then((list) => list.map(({ available }) => available))
                                .then((list) => {
                                    const hash = utils.toHash(list, 'asset.id');
                                    const amount = this.tx.amount;
                                    if (!hash[amount.asset.id] ||
                                        hash[amount.asset.id].lt(amount) ||
                                        amount.getTokens().lte(0)) {

                                        errors.push({
                                            literal: 'confirmTransaction.send.errors.balance.invalid'
                                        });
                                    }
                                }),
                            utils.resolve(utils.when(validateService.wavesAddress(this.tx.recipient)))
                                .then(({ state }) => {
                                    if (!state) {
                                        errors.push({
                                            literal: 'confirmTransaction.send.errors.recipient.invalid'
                                        });
                                    }
                                })
                        ]).then(() => {
                            this.errors = errors;
                            $scope.$apply();
                        });
                    }
                } else {
                    this.errors = [];
                }
            }

            /**
             * @param {string} str
             * @returns {string}
             */
            static upFirstChar(str) {
                return str.charAt(0).toUpperCase() + str.slice(1);
            }

            static toBigNumber(amount) {
                return amount && amount.getTokens().toFixed() || undefined;
            }

        }

        return new ConfirmTransaction();
    };

    controller.$inject = [
        'Base',
        'waves',
        '$attrs',
        '$mdDialog',
        'modalManager',
        'user',
        '$scope',
        'utils',
        'validateService'
    ];

    angular.module('app.ui').component('wConfirmTransaction', {
        bindings: {
            tx: '<',
            onClickBack: '&',
            onTxSent: '&',
            noBackButton: '<',
            warning: '<',
            showValidationErrors: '<',
            referrer: '<'
        },
        templateUrl: 'modules/ui/directives/confirmTransaction/confirmTransaction.html',
        transclude: false,
        controller
    });
})();

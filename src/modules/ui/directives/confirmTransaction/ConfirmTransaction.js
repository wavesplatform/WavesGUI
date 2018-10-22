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
        const { Asset } = require('@waves/data-entities');
        const { TRANSACTION_TYPE_NUMBER } = require('@waves/signature-adapter');
        const { SIGN_TYPE } = require('@waves/signature-adapter');

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
                 * @type {string}
                 */
                this.permissionName = '';
                // /**
                //  * @type {boolean}
                //  */
                // this.has2fa = null;

                this.observe('tx', this._onChangeTx);
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
                        this.deviceSignFail = false;
                        this.loadingSignFromDevice = this.canSignFromDevice();
                        if (this.errors.length && this.loadingSignFromDevice) {
                            throw new Error('No money');
                        }
                        $scope.$digest();
                        return this.signTx();
                    })
                    .then(preparedTx => {
                        this.preparedTx = preparedTx;

                        if (this.canSignFromDevice() && !this.wasDestroed) {
                            this.confirm();
                        }
                    })
                    .catch(() => {
                        this.loadingSignFromDevice = false;
                        this.deviceSignFail = true;
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
                return this.sendTransaction().then(tx => {
                    this.tx.id = tx.id;

                    if (this._isIssueTx()) {
                        this._saveIssueAsset(tx);
                    }

                    this.step++;
                    this.onTxSent({ id: tx.id });
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
                const amount = ConfirmTransaction.toBigNumber(this.tx.amount);

                return ds.broadcast(this.preparedTx).then((data) => {
                    analytics.push(
                        'Transaction', `Transaction.${this.tx.type}.${WavesApp.type}`,
                        `Transaction.${this.tx.type}.${WavesApp.type}.Success`, amount
                    );
                    return data;
                }, (error) => {
                    analytics.push(
                        'Transaction', `Transaction.${this.tx.type}.${WavesApp.type}`,
                        `Transaction.${this.tx.type}.${WavesApp.type}.Error`, amount
                    );
                    return Promise.reject(error);
                });
            }

            _isIssueTx() {
                return this.tx.type === SIGN_TYPE.ISSUE;
            }

            _saveIssueAsset(tx) {
                waves.node.height().then(height => {
                    ds.assetStorage.save(tx.id, new Asset({
                        ...tx,
                        ticker: null,
                        precision: tx.decimals,
                        height
                    }));
                });
            }

            /**
             * @private
             */
            _onChangeTx() {
                const timestamp = ds.utils.normalizeTime(this.tx.timestamp || Date.now());
                const data = { ...this.tx, timestamp };
                const type = this.tx.type;
                this.permissionName = ConfirmTransaction._getPermissionNameByTx(this.tx);

                this._signable = ds.signature.getSignatureApi()
                    .makeSignable({ type, data });

                this._signable.getId().then(id => {
                    this.txId = id;
                    $scope.$digest();
                });
            }

            /**
             * @private
             */
            _showErrors() {
                let promise;
                switch (true) {
                    case (this.tx.type === TRANSACTION_TYPE_NUMBER.SPONSORSHIP):
                        promise = this._validateAmount(this.tx.fee);
                        break;
                    case (this.tx.transactionType === TRANSACTION_TYPE_NUMBER.TRANSFER && this.showValidationErrors):
                        promise = Promise.all([
                            this._validateAmount(this.tx.amount),
                            this._validateAddress()
                        ]).then(([errors1, errors2]) => [...errors1, ...errors2]);
                        break;
                    default:
                        promise = Promise.resolve([]);
                }

                return promise.then((errors) => {
                    this.errors = errors;
                    $scope.$apply();
                });
            }

            /**
             * @return {Promise<Array | never>}
             * @private
             */
            _validateAddress() {
                const errors = [];
                return utils.resolve(utils.when(validateService.wavesAddress(this.tx.recipient)))
                    .then(({ state }) => {
                        if (!state) {
                            errors.push({
                                literal: 'confirmTransaction.send.errors.recipient.invalid'
                            });
                        }
                        return errors;
                    });
            }

            /**
             * @param amount
             * @return {*}
             * @private
             */
            _validateAmount(amount) {
                const errors = [];

                if (this.tx.type === TRANSACTION_TYPE_NUMBER.SPONSORSHIP) {
                    return waves.node.assets.userBalances()
                        .then((list) => list.map(({ available }) => available))
                        .then((list) => {
                            const hash = utils.toHash(list, 'asset.id');
                            if (!hash[amount.asset.id] ||
                                hash[amount.asset.id].lt(amount) ||
                                amount.getTokens().lte(0)) {

                                errors.push({
                                    literal: 'confirmTransaction.send.errors.balance.invalid'
                                });
                            }

                            return errors;
                        });
                } else {
                    return Promise.resolve([]);
                }
            }

            static toBigNumber(amount) {
                return amount && amount.getTokens().toFixed() || undefined;
            }

            static _getPermissionNameByTx(tx) {
                switch (tx.type) {
                    case 3:
                        return 'CAN_ISSUE_TRANSACTION';
                    case 4:
                        return 'CAN_TRANSFER_TRANSACTION';
                    case 5:
                        return 'CAN_REISSUE_TRANSACTION';
                    case 6:
                        return 'CAN_BURN_TRANSACTION';
                    case 7:
                        throw new Error('Can\' confirm exchange transaction!');
                    case 8:
                        return 'CAN_LEASE_TRANSACTION';
                    case 9:
                        return 'CAN_CANCEL_LEASE_TRANSACTION';
                    case 10:
                        return 'CAN_CREATE_ALIAS_TRANSACTION';
                    case 11:
                        return 'CAN_MASS_TRANSFER_TRANSACTION';
                    case 12:
                        return 'CAN_DATA_TRANSACTION';
                    case 13:
                        return 'CAN_SET_SCRIPT_TRANSACTION';
                    case 14:
                        return 'CAN_SPONSORSHIP_TRANSACTION';
                    default:
                        return '';
                }
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

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
                 */
                this.signable = null;

                this.observe('signable', this._onChangeSignable);
                this.observe(['showValidationErrors', 'signable'], this._showErrors);
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
                return this.signable.getId();
            }

            signTx() {
                this.loadingSignFromDevice = this.canSignFromDevice();
                return this.signable.getDataForApi();
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

                    if (ConfirmTransaction._isIssueTx(tx)) {
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
            _onChangeSignable() {
                if (this.signable) {
                    this.tx = this.signable.getTxData();
                    this.signable.getId().then(id => {
                        this.txId = id;
                        $scope.$digest();
                    });
                } else {
                    this.txId = '';
                    this.tx = null;
                }
            }

            /**
             * @private
             */
            _showErrors() {
                if (!this.signable) {
                    return null;
                }

                let promise;

                const { type, amount, fee } = this.signable.getTxData();

                switch (true) {
                    case (type === TRANSACTION_TYPE_NUMBER.SPONSORSHIP):
                        promise = this._validateAmount(fee);
                        break;
                    case (type === TRANSACTION_TYPE_NUMBER.TRANSFER && this.showValidationErrors):
                        promise = Promise.all([
                            this._validateAmount(amount),
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
                const { recipient } = this.signable.getTxData();
                const errors = [];
                return utils.resolve(utils.when(validateService.wavesAddress(recipient)))
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
                const { type } = this.signable.getTxData();

                if (type === TRANSACTION_TYPE_NUMBER.SPONSORSHIP) {
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

            static _isIssueTx(tx) {
                return tx.type === SIGN_TYPE.ISSUE;
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
            signable: '<',
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

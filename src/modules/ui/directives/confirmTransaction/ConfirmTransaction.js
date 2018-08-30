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

        const TYPES = WavesApp.TRANSACTION_TYPES.NODE;

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

                this.observe('showValidationErrors', this._showErrors);
            }

            $postLink() {
                const timestamp = ds.utils.normalizeTime(this.tx.timestamp || Date.now());
                const tx = { ...this.tx, timestamp };

                Promise.all([
                    ConfirmTransaction.switchOnTxType(ds.prepareForBroadcast, tx.transactionType, tx),
                    ConfirmTransaction.switchOnTxType(ds.getTransactionId, tx.transactionType, tx)
                ]).then(([preparedTx, txId]) => {
                    this.preparedTx = preparedTx;
                    this.txId = txId;
                });
            }

            confirm() {
                return this.sendTransaction().then(({ id }) => {
                    this.tx.id = id;
                    this.step++;
                    this.onTxSent({ id });
                    $scope.$apply();
                }).catch((e) => {
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
            _showErrors() {
                if (this.showValidationErrors) {
                    if (this.tx.transactionType === TYPES.TRANSFER) {
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
             * @param {Function} fn
             * @param {string} typeName
             * @param {object} tx
             * @return {*}
             */
            static switchOnTxType(fn, typeName, tx) {
                switch (typeName) {
                    case TYPES.TRANSFER:
                        return fn(4, tx);
                    case TYPES.MASS_TRANSFER:
                        return fn(11, tx);
                    case TYPES.EXCHANGE:
                        throw new Error('Can\'t create exchange transaction!');
                    case TYPES.LEASE:
                        return fn(8, tx);
                    case TYPES.CANCEL_LEASING:
                        return fn(9, tx);
                    case TYPES.CREATE_ALIAS:
                        return fn(10, tx);
                    case TYPES.ISSUE:
                        return fn(3, tx);
                    case TYPES.REISSUE:
                        return fn(5, tx);
                    case TYPES.BURN:
                        return fn(6, tx);
                    default:
                        throw new Error('Wrong transaction type!');
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

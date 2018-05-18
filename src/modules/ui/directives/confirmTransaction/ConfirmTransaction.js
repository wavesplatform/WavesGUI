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

                this.observe('showValidationErrors', this._showErrors);
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
                return user.getSeed().then(({ keyPair }) => {
                    let txPromise = null;

                    switch (this.tx.transactionType) {
                        case TYPES.TRANSFER:
                            txPromise = waves.node.assets.transfer({ ...this.tx, keyPair });
                            break;
                        case TYPES.MASS_TRANSFER:
                            txPromise = waves.node.assets.massTransfer({ ...this.tx, keyPair });
                            break;
                        case TYPES.EXCHANGE:
                            throw new Error('Can\'t create exchange transaction!');
                        case TYPES.LEASE:
                            txPromise = waves.node.lease({ ...this.tx, keyPair });
                            break;
                        case TYPES.CANCEL_LEASING:
                            txPromise = waves.node.cancelLeasing({
                                fee: this.tx.fee,
                                timestamp: this.tx.timestamp,
                                transactionId: this.tx.leaseTransactionId,
                                keyPair
                            });
                            break;
                        case TYPES.CREATE_ALIAS:
                            txPromise = waves.node.aliases.createAlias({ ...this.tx, keyPair });
                            break;
                        case TYPES.ISSUE:
                            txPromise = waves.node.assets.issue({ ...this.tx, keyPair });
                            break;
                        case TYPES.REISSUE:
                            txPromise = waves.node.assets.reissue({ ...this.tx, keyPair });
                            break;
                        case TYPES.BURN:
                            txPromise = waves.node.assets.burn({ ...this.tx, keyPair });
                            break;
                        default:
                            throw new Error('Wrong transaction type!');
                    }

                    const txType = ConfirmTransaction.upFirstChar(this.tx.transactionType);
                    const amount = ConfirmTransaction.toBigNumber(this.tx.amount);

                    return txPromise.then((data) => {
                        analytics.push('Transaction', `Transaction.${txType}`, `Transaction.${txType}.Success`, amount);
                        return data;
                    }, (error) => {
                        analytics.push('Transaction', `Transaction.${txType}`, `Transaction.${txType}.Error`, amount);
                        return Promise.reject(error);
                    });
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
            showValidationErrors: '<',
            referrer: '<'
        },
        templateUrl: 'modules/ui/directives/confirmTransaction/confirmTransaction.html',
        transclude: false,
        controller
    });
})();

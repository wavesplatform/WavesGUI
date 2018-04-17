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
     * @param {app.utils} utils
     * @returns {ConfirmTransaction}
     */
    const controller = function (Base, waves, $attrs, $mdDialog, modalManager, user, utils) {

        const TYPES = WavesApp.TRANSACTION_TYPES.NODE;

        class ConfirmTransaction extends Base {

            constructor() {
                super();

                this.locale = $attrs.locale || 'app.ui';
                this.step = 0;
            }

            confirm() {
                return utils.when(this.sendTransaction()).then(({ id }) => {
                    this.tx.id = id;
                    this.step++;
                }).catch((e) => {
                    console.error(e);
                    console.error('Transaction error!');
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
                            txPromise = waves.node.massTransfer({ ...this.tx, keyPair });
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

    controller.$inject = ['Base', 'waves', '$attrs', '$mdDialog', 'modalManager', 'user', 'utils'];

    angular.module('app.ui').component('wConfirmTransaction', {
        bindings: {
            tx: '<',
            onClickBack: '&'
        },
        templateUrl: 'modules/ui/directives/confirmTransaction/confirmTransaction.html',
        transclude: false,
        controller
    });
})();

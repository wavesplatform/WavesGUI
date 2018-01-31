(function () {
    'use strict';

    /**
     * @param Base
     * @param {Waves} waves
     * @param $attrs
     * @param {$mdDialog} $mdDialog
     * @param {ModalManager} modalManager
     * @param {User} user
     * @returns {ConfirmTransaction}
     */
    const controller = function (Base, waves, $attrs, $mdDialog, modalManager, user) {

        class ConfirmTransaction extends Base {

            constructor() {
                super();

                this.locale = $attrs.locale || 'app.ui';
                this.step = 0;
            }

            confirm() {
                // this.sendTransaction().then(({ id }) => {
                //     this.tx.id = id;
                    this.step++;
                // }).catch((e) => {
                //     console.error(e);
                //     console.error('Transaction error!');
                // });
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
                        case 'transfer':
                            txPromise = waves.node.assets.transfer({ ...this.tx, keyPair });
                            break;
                        case 'exchange':
                            throw new Error('Can\'t create exchange transaction!');
                        case 'lease':
                            txPromise = waves.node.lease({ ...this.tx, keyPair });
                            break;
                        case 'cancelLeasing':
                            txPromise = waves.node.cancelLeasing({ ...this.tx, keyPair });
                            break;
                        case 'createAlias':
                            txPromise = waves.node.aliases.createAlias({ ...this.tx, keyPair });
                            break;
                        case 'issue':
                            txPromise = waves.node.assets.issue({ ...this.tx, keyPair });
                            break;
                        case 'reissue':
                            txPromise = waves.node.assets.reissue({ ...this.tx, keyPair });
                            break;
                        case 'burn':
                            txPromise = waves.node.assets.burn({ ...this.tx, keyPair });
                            break;
                        default:
                            throw new Error('Wrong transaction type!');
                    }

                    const txType = ConfirmTransaction.upFirstChar(this.tx.transactionType);
                    const amount = this.tx.amount && this.tx.amount.toFormat() || undefined;

                    return txPromise.then((data) => {
                        analytics.push('Transaction', `Transaction.${txType}.Success`, amount);
                        return data;
                    }, (error) => {
                        analytics.push('Transaction', `Transaction.${txType}.Error`, amount);
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

        }

        return new ConfirmTransaction();
    };

    controller.$inject = ['Base', 'waves', '$attrs', '$mdDialog', 'modalManager', 'user'];

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

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
                this.sendTransaction().then(({ id }) => {
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
                    switch (this.tx.transactionType) {
                        case 'transfer':
                            return waves.node.assets.transfer({ ...this.tx, keyPair }).then((data) => {
                                analytics.push('Send', 'Send.Success', this.assetId, this.amount.toString());
                                return data;
                            }, (e) => {
                                analytics.push('Send', 'Send.Error', this.assetId, this.amount.toString());
                                return Promise.reject(e);
                            });
                        case 'exchange':
                            throw new Error('Can\'t create exchange transaction!');
                        case 'lease':
                            return waves.node.lease({ ...this.tx, keyPair });
                        case 'cancelLeasing':
                            return waves.node.cancelLeasing({ ...this.tx, keyPair });
                        case 'createAlias':
                            return waves.node.aliases.createAlias({ ...this.tx, keyPair });
                        case 'issue':
                            return waves.node.assets.issue({ ...this.tx, keyPair });
                        case 'reissue':
                            return waves.node.assets.reissue({ ...this.tx, keyPair });
                        case 'burn':
                            return waves.node.assets.burn({ ...this.tx, keyPair });
                        default:
                            throw new Error('Wrong transaction type!');
                    }
                });
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

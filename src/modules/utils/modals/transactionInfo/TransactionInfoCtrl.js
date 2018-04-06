(function () {
    'use strict';

    /**
     *
     * @param Base
     * @param $scope
     * @param {ExplorerLinks} explorerLinks
     * @param {Waves} waves
     * @param {IPollCreate} createPoll
     * @return {TransactionInfoCtrl}
     */
    const controller = function (Base, $scope, explorerLinks, waves, createPoll) {

        class TransactionInfoCtrl extends Base {

            constructor({ transactionId }) {
                super($scope);

                this.id = transactionId;

                waves.node.transactions.getAlways(transactionId)
                    .then((transaction) => {
                        if (!transaction.isUTX) {
                            return waves.node.height().then((height) => ({
                                confirmations: height - transaction.height,
                                transaction
                            }));
                        } else {
                            return {
                                confirmations: -1,
                                transaction
                            };
                        }
                    })
                    .then(({ transaction, confirmations }) => {

                        this.transaction = transaction;
                        this.confirmations = confirmations;
                        this.confirmed = confirmations >= 0;
                        this.explorerLink = explorerLinks.getTxLink(transaction.id);

                        createPoll(this, this._getHeight, this._setHeight, 1000);
                    });
            }

            /**
             * @return {Promise<Array>}
             * @private
             */
            _getHeight() {
                return Promise.all([
                    waves.node.height(),
                    waves.node.transactions.getAlways(this.id)
                ]);
            }

            /**
             * @param {number} height
             * @param tx
             * @private
             */
            _setHeight([height, tx]) {
                Object.assign(this.transaction, tx);
                if (!tx.isUTX) {
                    this.confirmations = height - tx.height;
                    this.confirmed = this.confirmations >= 0;
                    $scope.$apply();
                }
            }

        }

        return new TransactionInfoCtrl(this.locals);
    };

    controller.$inject = ['Base', '$scope', 'explorerLinks', 'waves', 'createPoll'];

    angular.module('app.utils').controller('TransactionInfoCtrl', controller);
})();

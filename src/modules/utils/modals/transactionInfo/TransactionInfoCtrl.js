(function () {
    'use strict';

    /**
     *
     * @param Base
     * @param $scope
     * @param {ExplorerLinks} explorerLinks
     * @param {Waves} waves
     * @param {function} createPoll
     * @return {TransactionInfoCtrl}
     */
    const controller = function (Base, $scope, explorerLinks, waves, createPoll) {

        class TransactionInfoCtrl extends Base {

            constructor({ transactionId }) {
                super($scope);
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

                        createPoll(this, this._getHeight, this._setHeight, 2000);
                    });
            }

            _getHeight() {
                return waves.node.height();
            }

            _setHeight(height) {
                this.confirmations = height - this.transaction.height;
                this.confirmed = this.confirmations >= 0;
            }
        }

        return new TransactionInfoCtrl(this.locals);
    };

    controller.$inject = ['Base', '$scope', 'explorerLinks', 'waves', 'createPoll'];

    angular.module('app.utils').controller('TransactionInfoCtrl', controller);
})();

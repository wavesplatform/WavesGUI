(function () {
    'use strict';

    const PATH = 'modules/utils/modals/transactionInfo/types';

    /**
     *
     * @param Base
     * @param $scope
     * @param $filter
     * @param {ExplorerLinks} explorerLinks
     * @param {BaseAssetService} baseAssetService
     * @param {DexService} dexService
     * @param {Waves} waves
     * @return {TransactionInfoCtrl}
     */
    const controller = function (Base, $scope, $filter, explorerLinks, baseAssetService, dexService, waves) {

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
                        // TODO Move to component 16.01.18 16:47 from Tsigel
                    });
            }

        }

        return new TransactionInfoCtrl(this.locals);
    };

    controller.$inject = ['Base', '$scope', '$filter', 'explorerLinks', 'baseAssetService', 'dexService', 'waves'];

    angular.module('app.utils').controller('TransactionInfoCtrl', controller);
})();

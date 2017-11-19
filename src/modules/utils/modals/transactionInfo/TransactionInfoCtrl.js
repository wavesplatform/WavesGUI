(function () {
    'use strict';

    const PATH = 'modules/utils/modals/transactionInfo/types';

    /**
     *
     * @param Base
     * @param $scope
     * @param $filter
     * @param {TransactionsService} transactionsService
     * @param blocksService
     * @param {ExplorerLinks} explorerLinks
     * @param {BaseAssetService} baseAssetService
     * @return {TransactionInfoCtrl}
     */
    const controller = function (Base, $scope, $filter, transactionsService, blocksService, explorerLinks,
                                 baseAssetService) {

        class TransactionInfoCtrl extends Base {

            constructor({ transactionId }) {
                super($scope);
                transactionsService.get(transactionId)
                    .then((transaction) => {
                        if (transaction.height >= 0) {
                            return blocksService.getHeight().then((height) => ({
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

                        this.templateUrl = `${PATH}/${transaction.templateType}.html`;
                        this.datetime = $filter('date')(transaction.timestamp, 'dd.MM.yyyy, HH:mm');
                        this.shownAddress = transaction.shownAddress;
                        this.type = transaction.type;

                        this.explorerLink = explorerLinks.getTxLink(transaction.id);

                        if (transaction.amount) {
                            baseAssetService.convertToBaseAsset(transaction.amount)
                                .then((baseMoney) => {
                                    this.mirrorBalance = baseMoney;
                                });
                        }
                    });
            }

        }

        return new TransactionInfoCtrl(this.locals);
    };

    controller.$inject = [
        'Base', '$scope', '$filter', 'transactionsService', 'blocksService',
        'explorerLinks', 'baseAssetService'
    ];

    angular.module('app.utils').controller('TransactionInfoCtrl', controller);
})();

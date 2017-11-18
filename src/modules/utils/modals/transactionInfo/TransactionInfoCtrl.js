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
                        this.transaction = transaction;

                        this.templateUrl = `${PATH}/${this.transaction.templateType}.html`;
                        this.datetime = $filter('date')(this.transaction.timestamp, 'dd.MM.yyyy, HH:mm');
                        this.shownAddress = this.transaction.shownAddress;
                        this.type = this.transaction.type;

                        this.explorerLink = explorerLinks.getTxLink(this.transaction.id);

                        if (this.transaction.height >= 0) {
                            blocksService.getHeight().then((height) => {
                                this.confirmations = height - this.transaction.height;
                            });
                        } else {
                            this.confirmations = -1
                        }

                        const TYPES = transactionsService.TYPES;
                        if (this.type === TYPES.SEND || this.type === TYPES.RECEIVE || this.type === TYPES.CIRCULAR) {
                            baseAssetService.convertToBaseAsset(this.transaction.amount)
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

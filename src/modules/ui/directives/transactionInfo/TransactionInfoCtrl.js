(function () {
    'use strict';

    const PATH = 'modules/ui/directives/transactionInfo/types';

    /**
     *
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param $filter
     * @param {ExplorerLinks} explorerLinks
     * @param {BaseAssetService} baseAssetService
     * @param {DexService} dexService
     * @param {Waves} waves
     * @return {TransactionInfoCtrl}
     */
    const controller = function (Base, $scope, $filter, explorerLinks, baseAssetService, dexService, waves) {

        class TransactionInfoCtrl extends Base {

            constructor() {
                super($scope);

                /**
                 * @type {ITransaction}
                 */
                this.transaction = null;
            }

            $postLink() {
                const transaction = this.transaction;

                this.templateUrl = `${PATH}/${transaction.templateType}.html`;
                this.datetime = $filter('date')(transaction.timestamp, 'dd.MM.yyyy, HH:mm');
                this.shownAddress = transaction.shownAddress;
                this.type = transaction.type;
                this.numberOfRecipients = transaction.numberOfRecipients;

                this.explorerLink = explorerLinks.getTxLink(transaction.id);

                if (transaction.amount || transaction.leaseTransactionAmount) {
                    const amount = transaction.amount || transaction.leaseTransactionAmount;
                    baseAssetService.convertToBaseAsset(amount)
                        .then((baseMoney) => {
                            this.mirrorBalance = baseMoney;
                            $scope.$digest();
                        });
                }

                const TYPES = waves.node.transactions.TYPES;
                if (this.type === TYPES.EXCHANGE_BUY || this.type === TYPES.EXCHANGE_SELL) {
                    this.totalPrice = dexService.getTotalPrice(this.transaction.amount, this.transaction.price);
                    if (this.type === TYPES.EXCHANGE_BUY) {
                        this.calculatedFee = this.transaction.buyMatcherFee;
                    } else {
                        this.calculatedFee = this.transaction.sellMatcherFee;
                    }
                } else {
                    this.calculatedFee = this.transaction.fee;
                }
            }

        }

        return new TransactionInfoCtrl();
    };

    controller.$inject = ['Base', '$scope', '$filter', 'explorerLinks', 'baseAssetService', 'dexService', 'waves'];

    angular.module('app.ui').component('wTransactionInfo', {
        bindings: {
            transaction: '<'
        },
        templateUrl: 'modules/ui/directives/transactionInfo/transaction-info.html',
        controller
    });
})();

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
                this.txId = null;
            }

            $postLink() {
                const transaction = this.transaction;
                this.templateUrl = `${PATH}/${transaction.templateType}.html`;
                this.datetime = $filter('date')(transaction.timestamp, 'dd.MM.yyyy, HH:mm');
                this.shownAddress = transaction.shownAddress;
                this.typeName = transaction.typeName;
                this.numberOfRecipients = transaction.numberOfRecipients;
                this.isScam = !!WavesApp.scam[this.transaction.assetId];
                this.explorerLink = explorerLinks.getTxLink(transaction.id);
                if (transaction.amount || (transaction.lease && transaction.lease.amount)) {
                    const amount = transaction.amount || transaction.lease.amount;
                    baseAssetService.convertToBaseAsset(amount)
                        .then((baseMoney) => {
                            this.mirrorBalance = baseMoney;
                            $scope.$digest();
                        });
                }

                const TYPES = waves.node.transactions.TYPES;

                if (this.typeName === TYPES.BURN || this.typeName === TYPES.ISSUE || this.typeName === TYPES.REISSUE) {
                    this.name = tsUtils.get(this.transaction, 'amount.asset.name') ||
                        tsUtils.get(this.transaction, 'quantity.asset.name') ||
                        this.transaction.name;
                    this.amount = (tsUtils.get(this.transaction, 'amount') ||
                        tsUtils.get(this.transaction, 'quantity')).toFormat();
                    this.quantity = this.transaction.quantity || this.transaction.amount;
                    this.precision = this.transaction.precision ||
                        (this.quantity.asset ? this.quantity.asset.precision : 0);
                }

                if (this.typeName === TYPES.EXCHANGE_BUY || this.typeName === TYPES.EXCHANGE_SELL) {
                    this.totalPrice = dexService.getTotalPrice(this.transaction.amount, this.transaction.price);
                    if (this.typeName === TYPES.EXCHANGE_BUY) {
                        this.calculatedFee = this.transaction.buyMatcherFee;
                    } else {
                        this.calculatedFee = this.transaction.sellMatcherFee;
                    }
                } else if (this.typeName === TYPES.SPONSORSHIP_FEE) {
                    this.calculatedFee = null;
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
            transaction: '<',
            txId: '<',
            warning: '<'
        },
        templateUrl: 'modules/ui/directives/transactionInfo/transaction-info.html',
        controller
    });
})();

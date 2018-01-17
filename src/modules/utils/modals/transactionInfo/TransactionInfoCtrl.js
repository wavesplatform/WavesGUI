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

                        this.templateUrl = `${PATH}/${transaction.templateType}.html`;
                        this.datetime = $filter('date')(transaction.timestamp, 'dd.MM.yyyy, HH:mm');
                        this.shownAddress = transaction.shownAddress;
                        this.type = transaction.type;

                        this.explorerLink = explorerLinks.getTxLink(transaction.id);

                        if (transaction.amount || transaction.leaseTransactionAmount) {
                            const amount = transaction.amount || transaction.leaseTransactionAmount;
                            baseAssetService.convertToBaseAsset(amount)
                                .then((baseMoney) => {
                                    this.mirrorBalance = baseMoney;
                                });
                        }

                        const TYPES = waves.node.transactions.TYPES;
                        if (this.type === TYPES.EXCHANGE_BUY || this.type === TYPES.EXCHANGE_SELL) {
                            this.totalPrice = dexService.getTotalPrice(this.transaction.amount, this.transaction.price);
                            if (this.type === TYPES.EXCHANGE_BUY) {
                                this.calculatedFee = this.transaction.buyMatcherFee.toFormat();
                            } else {
                                this.calculatedFee = this.transaction.sellMatcherFee.toFormat();
                            }
                        } else {
                            this.calculatedFee = this.transaction.fee.toFormat();
                        }
                    });
            }

        }

        return new TransactionInfoCtrl(this.locals);
    };

    controller.$inject = ['Base', '$scope', '$filter', 'explorerLinks', 'baseAssetService', 'dexService', 'waves'];

    angular.module('app.utils').controller('TransactionInfoCtrl', controller);
})();

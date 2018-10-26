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
     * @return {TransactionInfoContent}
     */
    const controller = function (Base, $scope, $filter, explorerLinks, baseAssetService, dexService, waves) {

        const ds = require('data-service');
        const { Money } = require('@waves/data-entities');

        class TransactionInfoContent extends Base {

            constructor() {
                super($scope);

                /**
                 * @type {ITransaction}
                 */
                this.transaction = null;
                /**
                 * @type {string}
                 */
                this.txId = null;
            }

            $postLink() {
                if (!this.signable) {
                    throw new Error('Has no signable!');
                }
                const transaction = waves.node.transactions.createTransaction(this.signable.getTxData());
                this.transaction = transaction;

                this.signable.getId().then(id => {
                    this.txId = id;
                });

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
                    ds.api.assets.get('WAVES').then((asset) => {
                        this.calculatedFee = new Money(100000, asset); // TODO hardcode fee
                        $scope.$digest();
                    });
                } else if (this.typeName === TYPES.SPONSORSHIP_START) {
                    this.isSponsoredFee = true;
                    this.calculatedFee = this.transaction.fee;
                } else {
                    this.calculatedFee = this.transaction.fee;
                }
            }

        }

        return new TransactionInfoContent();
    };

    controller.$inject = ['Base', '$scope', '$filter', 'explorerLinks', 'baseAssetService', 'dexService', 'waves'];

    angular.module('app.ui').component('wTransactionInfoContent', {
        bindings: {
            signable: '<'
        },
        templateUrl: 'modules/ui/directives/transactionInfo/transaction-info-content.html',
        controller
    });
})();

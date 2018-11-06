(function () {
    'use strict';

    const PATH = 'modules/ui/directives/transactionInfo/types';
    const ds = require('data-service');
    const { Money } = require('@waves/data-entities');

    /**
     * @param Base
     * @param $filter
     * @param explorerLinks
     * @param {BaseAssetService} baseAssetService
     * @param dexService
     * @param waves
     * @return {BaseTxInfo}
     */
    const factory = function (Base, $filter, explorerLinks, baseAssetService, dexService, waves) {

        class BaseTxInfo extends Base {

            transaction = null;
            /**
             * @type {$rootScope.Scope}
             */
            $scope = null;
            txId = null;
            templatePostfix = '';
            needShowMirror = true;

            constructor($scope) {
                super();

                this.$scope = $scope;
            }


            $postLink() {
                if (!this.signable) {
                    throw new Error('Has no signable!');
                }

                const $scope = this.$scope;

                const transaction = waves.node.transactions.createTransaction(this.signable.getTxData());
                this.transaction = transaction;

                this.signable.getId().then(id => {
                    this.txId = id;
                    this.$scope.$apply();
                });

                this.templateUrl = `${PATH}/${transaction.templateType}${this.templatePostfix}.html`;
                this.datetime = $filter('date')(transaction.timestamp, 'dd.MM.yyyy, HH:mm');
                this.shownAddress = transaction.shownAddress;
                this.typeName = transaction.typeName;
                this.numberOfRecipients = transaction.numberOfRecipients;
                this.isScam = !!WavesApp.scam[this.transaction.assetId];
                this.explorerLink = explorerLinks.getTxLink(transaction.id);
                if (transaction.amount || (transaction.lease && transaction.lease.amount)) {
                    const amount = transaction.amount || transaction.lease.amount;
                    this.needShowMirror = amount.asset.id !== baseAssetService.getBaseAssetId();
                    baseAssetService.convertToBaseAsset(amount)
                        .then((baseMoney) => {
                            this.mirrorBalance = baseMoney;
                            $scope.$digest();
                        });
                }

                const TYPES = waves.node.transactions.TYPES;

                if (this.typeName === TYPES.BURN || this.typeName === TYPES.ISSUE || this.typeName === TYPES.REISSUE) {
                    this._tokens();
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

            _tokens() {
                this.name = tsUtils.get(this.transaction, 'amount.asset.name') ||
                    tsUtils.get(this.transaction, 'quantity.asset.name') ||
                    this.transaction.name;
                this.amount = (tsUtils.get(this.transaction, 'amount') ||
                    tsUtils.get(this.transaction, 'quantity')).toFormat();
                this.quantity = this.transaction.quantity &&
                    this.transaction.quantity.div(Math.pow(10, this.transaction.precision)) ||
                    this.transaction.amount;
                this.precision = this.transaction.precision ||
                    (this.quantity.asset ? this.quantity.asset.precision : 0);
            }

        }

        return BaseTxInfo;
    };

    factory.$input = ['Base', '$filter', 'explorerLinks', 'baseAssetService', 'dexService', 'waves'];

    angular.module('app.ui').factory('BaseTxInfo', factory);
})();

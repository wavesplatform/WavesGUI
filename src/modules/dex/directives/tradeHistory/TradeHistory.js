/* global tsApiValidator */
(function () {
    'use strict';

    const tsApiValidator = require('ts-api-validator');

    /**
     * @param {Base} Base
     * @param {$rootScope.Scope} $scope
     * @param {Waves} waves
     * @param {DataFeed} dataFeed
     * @param {IPollCreate} createPoll
     * @param {app.utils} utils
     * @return {TradeHistory}
     */
    const controller = function (Base, $scope, waves, dataFeed, createPoll, utils) {

        class TotalAmountPart extends tsApiValidator.BasePart {

            getValue(data) {
                const amount = new BigNumber(data.amount);
                const price = new BigNumber(data.price);
                return amount.times(price);
            }

        }

        class TradeHistory extends Base {

            constructor() {
                super();
                /**
                 * @type {{amount: string, price: string}}
                 * @private
                 */
                this._assetIdPair = null;
                /**
                 * @type {Asset}
                 */
                this.priceAsset = null;
                /**
                 * @type {Array}
                 */
                this.orders = [];
                /**
                 * @type {boolean}
                 */
                this.pending = true;

                this.shema = new tsApiValidator.Schema({
                    type: tsApiValidator.ArrayPart,
                    required: true,
                    content: {
                        type: tsApiValidator.ObjectPart,
                        required: true,
                        content: {
                            price: { type: utils.apiValidatorParts.BigNumberPart, required: true },
                            amount: { type: utils.apiValidatorParts.BigNumberPart, required: true },
                            total: { type: TotalAmountPart, required: true, path: null },
                            date: { type: tsApiValidator.DatePart, required: true, path: 'timestamp' },
                            type: { type: tsApiValidator.StringPart, required: true },
                            id: { type: tsApiValidator.StringPart, required: true }
                        }
                    }
                });

                this.headers = [
                    {
                        id: 'type',
                        title: { literal: 'directives.tradeHistory.tableTitle.type' },
                        valuePath: 'item.type',
                        sort: true
                    },
                    {
                        id: 'price',
                        title: { literal: 'directives.tradeHistory.tableTitle.price' },
                        valuePath: 'item.price',
                        sort: true
                    },
                    {
                        id: 'amount',
                        title: { literal: 'directives.tradeHistory.tableTitle.size' },
                        valuePath: 'item.amount',
                        sort: true
                    },
                    {
                        id: 'total',
                        title: { literal: 'directives.tradeHistory.tableTitle.total' },
                        valuePath: 'item.total',
                        sort: true
                    },
                    {
                        id: 'time',
                        title: { literal: 'directives.tradeHistory.tableTitle.date' },
                        valuePath: 'item.date',
                        sort: true,
                        sortActive: true,
                        isAsc: false
                    }
                ];

                this.syncSettings({
                    _assetIdPair: 'dex.assetIdPair'
                });

                /**
                 * @type {Poll}
                 */
                this.poll = createPoll(this, this._getTradeHistory, 'orders', 2000, { $scope });

                this.observe('_assetIdPair', this._onChangeAssets);
                this.poll.ready.then(() => {
                    this.pending = false;
                });
                this._onChangeAssets();
            }

            $onDestroy() {
                super.$onDestroy();
                this.poll.destroy();
            }

            /**
             * @private
             */
            _onChangeAssets() {
                this.orders = [];
                this.poll.restart();
                ds.api.pairs.get(this._assetIdPair.amount, this._assetIdPair.price).then((pair) => {
                    this.priceAsset = pair.priceAsset;
                    this.amountAsset = pair.amountAsset;
                    $scope.$digest();
                });
            }

            /**
             * @return {Promise<any>}
             * @private
             */
            _getTradeHistory() {
                return dataFeed.trades(this._assetIdPair.amount, this._assetIdPair.price)
                    .then((data) => this.shema.parse(data))
                    .then(TradeHistory._filterDuplicate); // TODO remove with Dima's service
            }

            /**
             * @param list
             * @private
             */
            static _filterDuplicate(list) {
                const hash = Object.create(null);
                return list.reduce((result, item) => {
                    if (!hash[item.id]) {
                        result.push(item);
                    }
                    hash[item.id] = true;
                    return result;
                }, []);
            }

        }

        return new TradeHistory();
    };

    controller.$inject = ['Base', '$scope', 'waves', 'dataFeed', 'createPoll', 'utils'];

    angular.module('app.dex')
        .component('wDexTradeHistory', {
            templateUrl: 'modules/dex/directives/tradeHistory/tradeHistory.html',
            controller
        });
})();

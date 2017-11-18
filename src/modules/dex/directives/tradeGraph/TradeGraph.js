(function () {
    'use strict';

    /**
     * @param Base
     * @param utils
     * @param {AssetsService} assetsService
     * @param {app.utils.apiWorker} apiWorker
     * @return {TradeGraph}
     */
    const controller = function (Base, utils, assetsService, apiWorker) {

        class TradeGraph extends Base {

            constructor() {
                super();

                /**
                 * @type {string}
                 */
                this.amountAssetId = null;
                /**
                 * @type {string}
                 */
                this.priceAssetId = null;

                this.options = {
                    margin: {
                        left: -1,
                        top: 20,
                        right: -1,
                        bottom: 0
                    },
                    grid: {
                        x: false,
                        y: false
                    },
                    series: [
                        {
                            dataset: 'asks',
                            key: 'amount',
                            label: 'An area series',
                            color: '#F27057',
                            type: ['line', 'line', 'area'],
                        },
                        {
                            dataset: 'bids',
                            key: 'amount',
                            label: 'An area series',
                            color: '#2B9F72',
                            type: ['line', 'line', 'area'],
                        }
                    ],
                    axes: {
                        x: { key: 'price', type: 'linear' },
                        y: { key: 'amount', ticks: 4 }
                    }
                };

                this.data = {
                    asks: [{ amount: 0, price: 0 }],
                    bids: [{ amount: 0, price: 0 }]
                };

                this.syncSettings({
                    amountAssetId: 'dex.amountAssetId',
                    priceAssetId: 'dex.priceAssetId'
                });
                this.observe(['amountAssetId', 'priceAssetId'], this._onChangeAssets);
            }

            _onChangeAssets() {
                return apiWorker.process((Waves, { assetId1, assetId2 }) => {
                    return Waves.AssetPair.get(assetId1, assetId2).then((pair) => {
                        return Waves.API.Matcher.v1.getOrderbook(pair.amountAsset.id, pair.priceAsset.id)
                            .then((orderBook) => {

                                const process = function (list) {
                                    let sum = 0;
                                    return list.reduce((resutl, item) => {
                                        sum = sum + item.amount;
                                        resutl.push({
                                            amount: sum,
                                            price: item.price
                                        });
                                        return resutl;
                                    }, [])
                                };

                                return {
                                    bids: process(orderBook.bids || []),
                                    asks: process(orderBook.asks || [])
                                };
                            });
                    });
                }, { assetId1: this.amountAssetId, assetId2: this.priceAssetId })
                    .then(({ bids, asks }) => {
                        this.data.bids = bids;
                        this.data.asks = asks;
                    });
            }

        }

        return new TradeGraph();
    };

    controller.$inject = ['Base', 'utils', 'assetsService', 'apiWorker'];

    angular.module('app.dex')
        .component('wDexTradeGraph', {
            templateUrl: 'modules/dex/directives/tradeGraph/tradeGraph.html',
            controller
        });
})();

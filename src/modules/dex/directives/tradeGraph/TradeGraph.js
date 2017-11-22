(function () {
    'use strict';

    /**
     * @param Base
     * @param utils
     * @param {Waves} waves
     * @param {app.utils.apiWorker} apiWorker
     * @return {TradeGraph}
     */
    const controller = function (Base, utils, waves, apiWorker) {

        class TradeGraph extends Base {

            constructor() {
                super();

                /**
                 * @type {string}
                 */
                this._amountAssetId = null;
                /**
                 * @type {string}
                 */
                this._priceAssetId = null;
                /**
                 * @type {IAssetInfo}
                 * @private
                 */
                this._amountAsset = null;
                /**
                 * @type {IAssetInfo}
                 * @private
                 */
                this._priceAsset = null;

                this.options = {
                    margin: {
                        top: 10,
                        left: 70,
                        right: 70
                    },
                    grid: {
                        x: false,
                        y: false
                    },
                    tooltipHook: (d) => {
                        if (d) {
                            const x = d[0].row.x;
                            const precisionPrice = this._priceAsset && this._priceAsset.precision || 8;
                            const precisionAmount = this._amountAsset && this._amountAsset.precision || 8;
                            return {
                                abscissas: `Price ${x.toFixed(precisionPrice)}`,
                                rows: d.map((s) => {
                                    return {
                                        label: s.series.label,
                                        value: s.row.y1.toFixed(precisionAmount),
                                        color: s.series.color,
                                        id: s.series.id
                                    };
                                })
                            };
                        }
                    },
                    series: [
                        {
                            dataset: 'asks',
                            key: 'amount',
                            label: 'Asks',
                            color: '#f27057',
                            type: ['line', 'line', 'area']
                        },
                        {
                            dataset: 'bids',
                            key: 'amount',
                            label: 'Bids',
                            color: '#2b9f72',
                            type: ['line', 'line', 'area']
                        }
                    ],
                    axes: {
                        x: { key: 'price', type: 'linear', ticks: 4 },
                        y: { key: 'amount', ticks: 4 }
                    }
                };

                this.data = {
                    asks: [{ amount: 0, price: 0 }],
                    bids: [{ amount: 0, price: 0 }]
                };

                this.syncSettings({
                    _amountAssetId: 'dex.amountAssetId',
                    _priceAssetId: 'dex.priceAssetId'
                });

                this.observe(['_amountAssetId', '_priceAssetId'], this._onChangeAssets);
            }

            _onChangeAssets() {
                waves.node.assets.info(this._priceAssetId)
                    .then((asset) => {
                        this._priceAsset = asset;
                    });
                waves.node.assets.info(this._amountAssetId)
                    .then((asset) => {
                        this._amountAsset = asset;
                    });
                return apiWorker.process((Waves, { assetId1, assetId2 }) => { // TODO! Do. Author Tsigel at 22/11/2017 08:35
                    return Waves.AssetPair.get(assetId1, assetId2)
                        .then((pair) => {
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
                                        }, []);
                                    };

                                    const parse = function (list) {
                                        return Promise.all((list || []).map((item) => {
                                            return Promise.all([
                                                Waves.Money.fromCoins(String(item.amount), pair.amountAsset)
                                                    .then((amount) => {
                                                        return amount.getTokens();
                                                    }),
                                                Waves.OrderPrice.fromMatcherCoins(String(item.price), pair)
                                                    .then((orderPrice) => {
                                                        return orderPrice.getTokens();
                                                    })
                                            ])
                                                .then((amountPrice) => {
                                                    const amount = amountPrice[0];
                                                    const price = amountPrice[1];
                                                    return {
                                                        amount: Number(amount.toFixed(pair.amountAsset.precision)),
                                                        price: Number(price.toFixed(pair.priceAsset.precision))
                                                    };
                                                });
                                        }));
                                    };

                                    return Promise.all([
                                        parse(orderBook.bids),
                                        parse(orderBook.asks)
                                    ])
                                        .then((bidAsks) => {
                                            const bids = bidAsks[0];
                                            const asks = bidAsks[1];

                                            return { bids: process(bids), asks: process(asks) };
                                        });
                                });
                        });
                }, { assetId1: this._amountAssetId, assetId2: this._priceAssetId })
                    .then(({ bids, asks }) => {
                        this.data.bids = bids;
                        this.data.asks = asks;
                    });
            }

        }

        return new TradeGraph();
    };

    controller.$inject = ['Base', 'utils', 'waves'];

    angular.module('app.dex')
        .component('wDexTradeGraph', {
            templateUrl: 'modules/dex/directives/tradeGraph/tradeGraph.html',
            controller
        });
})();

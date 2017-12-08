(function () {
    'use strict';

    /**
     * @param Base
     * @param utils
     * @param {Waves} waves
     * @param {function} createPoll
     * @return {TradeGraph}
     */
    const controller = function (Base, utils, waves, createPoll) {

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
                 * @type {IAsset}
                 * @private
                 */
                this._amountAsset = null;
                /**
                 * @type {IAsset}
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
                                rows: d.map((s) => ({
                                    label: s.series.label,
                                    value: s.row.y1.toFixed(precisionAmount),
                                    color: s.series.color,
                                    id: s.series.id
                                }))
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

                /**
                 * @type {Poll}
                 * @private
                 */
                this._poll = createPoll(this, this._getOrderBook, this._setOrderBook, 1000);
            }

            _getOrderBook() {
                return waves.matcher.getOrderBook(this._priceAssetId, this._amountAssetId)
                    .then(TradeGraph._remapOrderBook);
            }

            _setOrderBook([bids, asks]) {
                this.data.bids = bids;
                this.data.asks = asks;
            }

            _onChangeAssets(noRestart) {
                waves.node.assets.info(this._priceAssetId)
                    .then((asset) => {
                        this._priceAsset = asset;
                    });
                waves.node.assets.info(this._amountAssetId)
                    .then((asset) => {
                        this._amountAsset = asset;
                    });
                if (!noRestart) {
                    this._poll.restart();
                }
            }

            static _remapOrderBook({ bids, asks, pair }) {

                const bidsDelta = bids.length ? new BigNumber(bids[0].price)
                    .sub(bids[bids.length - 1].price)
                    .abs() : new BigNumber(0);
                const asksDelta = asks.length ? new BigNumber(asks[0].price)
                    .sub(asks[asks.length - 1].price)
                    .abs() : new BigNumber(0);

                bids = bids.slice();
                asks = asks.slice();

                if (bidsDelta.gt(asksDelta)) {
                    asks.push({
                        amount: '0',
                        price: new BigNumber(asks[0].price)
                            .add(bidsDelta)
                            .toFixed(pair.priceAsset.precision)
                    });
                } else if (asksDelta.gt(bidsDelta)) {
                    bids.push({
                        amount: '0',
                        price: new BigNumber(bids[0].price)
                            .sub(asksDelta)
                            .toFixed(pair.priceAsset.precision)
                    });
                }

                const sum = function (list) {
                    let amount = 0;
                    return list.reduce((result, item) => {
                        amount += Number(item.amount);
                        result.push({
                            amount,
                            price: Number(item.price)
                        });
                        return result;
                    }, []);
                };

                return [
                    sum(bids),
                    sum(asks)
                ];
            }

        }

        return new TradeGraph();
    };

    controller.$inject = ['Base', 'utils', 'waves', 'createPoll'];

    angular.module('app.dex')
        .component('wDexTradeGraph', {
            templateUrl: 'modules/dex/directives/tradeGraph/tradeGraph.html',
            controller
        });
})();

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
                 * @type {{amount: string, price: string}}
                 * @private
                 */
                this._assetIdPair = null;
                /**
                 * @type {Asset}
                 * @private
                 */
                this._amountAsset = null;
                /**
                 * @type {Asset}
                 * @private
                 */
                this._priceAsset = null;
                /**
                 * @type {number}
                 * @private
                 */
                this._chartCropRate = null;

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
                        x: { key: 'price', type: 'linear', ticks: 2 },
                        y: { key: 'amount', ticks: 4 }
                    }
                };

                this.data = {
                    asks: [{ amount: 0, price: 0 }],
                    bids: [{ amount: 0, price: 0 }]
                };

                this.syncSettings({
                    _assetIdPair: 'dex.assetIdPair',
                    _chartCropRate: 'dex.chartCropRate'
                });

                this.observe(['_assetIdPair', '_chartCropRate'], this._onChangeAssets);

                /**
                 * @type {Poll}
                 * @private
                 */
                this._poll = createPoll(this, this._getOrderBook, this._setOrderBook, 1000);
            }

            _getOrderBook() {
                return waves.matcher.getOrderBook(this._assetIdPair.amount, this._assetIdPair.price)
                    .then((data) => this._filterOrders(data))
                    .then(TradeGraph._remapOrderBook);
            }

            _setOrderBook([bids, asks]) {
                this.data.bids = bids;
                this.data.asks = asks;
            }

            _filterOrders({ bids, asks }) {
                const spreadPrice = new BigNumber(asks[0].price)
                    .sub(bids[0].price)
                    .div(2)
                    .add(bids[0].price);
                const delta = spreadPrice.mul(this._chartCropRate).div(2);
                const max = spreadPrice.add(delta);
                const min = BigNumber.max(0, spreadPrice.sub(delta));

                return {
                    bids: bids.filter((bid) => new BigNumber(bid.price).gte(min)),
                    asks: asks.filter((ask) => new BigNumber(ask.price).lte(max))
                };
            }

            _onChangeAssets(noRestart) {

                waves.node.assets.info(this._assetIdPair.price)
                    .then((asset) => {
                        this._priceAsset = asset;
                    });
                waves.node.assets.info(this._assetIdPair.amount)
                    .then((asset) => {
                        this._amountAsset = asset;
                    });
                if (!noRestart) {
                    this._poll.restart();
                }
            }

            static _remapOrderBook({ bids, asks }) {

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

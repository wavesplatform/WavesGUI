(function () {
    'use strict';

    const ORDERS_STUB = [{ amount: 0, price: 0 }];

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
                    asks: ORDERS_STUB,
                    bids: ORDERS_STUB
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

            _onChangeAssets(noRestart) {
                if (!noRestart) {
                    this._poll.restart();
                }
            }

            _getOrderBook() {
                return (
                    waves.matcher
                        .getOrderBook(this._assetIdPair.amount, this._assetIdPair.price)
                        .then((data) => this._cutOffOutlyingOrders(data))
                        .then((data) => this._buildCumulativeOrderBook(data))
                );
            }

            _setOrderBook({ asks, bids }) {
                this.data.asks = asks;
                this.data.bids = bids;
            }

            _cutOffOutlyingOrders({ asks, bids }) {
                const spreadPrice = new BigNumber(asks[0].price)
                    .sub(bids[0].price)
                    .div(2)
                    .add(bids[0].price);
                const delta = spreadPrice.mul(this._chartCropRate).div(2);
                const max = spreadPrice.add(delta);
                const min = BigNumber.max(0, spreadPrice.sub(delta));

                return {
                    asks: asks.filter((ask) => new BigNumber(ask.price).lte(max)),
                    bids: bids.filter((bid) => new BigNumber(bid.price).gte(min))
                };
            }

            _buildCumulativeOrderBook({ asks, bids }) {
                return {
                    asks: this._buildCumulativeOrderList(asks),
                    bids: this._buildCumulativeOrderList(bids)
                };
            }

            _buildCumulativeOrderList(list) {
                let amount = 0;
                return list.reduce((result, item) => {
                    amount += Number(item.amount);
                    result.push({
                        amount,
                        price: Number(item.price)
                    });
                    return result;
                }, []);
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

(function () {
    'use strict';

    const ORDERS_TYPES = {
        asks: 'asks',
        bids: 'bids'
    };
    const SERIES_SETTINGS = {
        asks: {
            dataset: ORDERS_TYPES.asks,
            key: 'amount',
            label: 'Asks',
            color: '#f27057',
            type: ['line', 'line', 'area']
        },
        bids: {
            dataset: ORDERS_TYPES.bids,
            key: 'amount',
            label: 'Bids',
            color: '#2b9f72',
            type: ['line', 'line', 'area']
        }
    };
    const ORDER_LIST_STUB = [{ amount: 0, price: 0 }];
    const THRESHOLD_VALUES = {
        asks: 2,
        bids: 2
    };

    /**
     * @param Base
     * @param utils
     * @param {Waves} waves
     * @param {IPollCreate} createPoll
     * @param {$rootScope.Scope} $scope
     * @return {TradeGraph}
     */
    const controller = function (Base, utils, waves, createPoll, $scope) {

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

                /**
                 * @type {boolean}
                 * @private
                 */
                this.canShowGraph = false;

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
                        SERIES_SETTINGS.asks,
                        SERIES_SETTINGS.bids
                    ],
                    axes: {
                        x: { key: 'price', type: 'linear', ticks: 2 },
                        y: { key: 'amount', ticks: 4 }
                    }
                };

                this.data = {
                    asks: ORDER_LIST_STUB,
                    bids: ORDER_LIST_STUB
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
                        .then((orderBook) => this._cutOffOutlyingOrdersIfNecessary(orderBook))
                        .then(TradeGraph._buildCumulativeOrderBook)
                );
            }

            _setOrderBook(orderBook) {
                this._updateGraphAccordingToOrderBook(orderBook);

                this.data.asks = orderBook.asks;
                this.data.bids = orderBook.bids;

                $scope.$digest();
            }

            _cutOffOutlyingOrdersIfNecessary(orderBook) {
                if (TradeGraph._isLackOfAsks(orderBook) || TradeGraph._isLackOfBids(orderBook)) {
                    return orderBook;
                }

                const filteredOrderBook = this._cutOffOutlyingOrders(orderBook);

                if (TradeGraph._areEitherAsksOrBids(filteredOrderBook)) {
                    return filteredOrderBook;
                }

                return orderBook;
            }

            _cutOffOutlyingOrders({ asks, bids }) {
                const spreadPrice = new BigNumber(asks[0].price)
                    .add(bids[0].price)
                    .div(2);
                const delta = spreadPrice.mul(this._chartCropRate).div(2);
                const max = spreadPrice.add(delta);
                const min = BigNumber.max(0, spreadPrice.sub(delta));

                return {
                    asks: asks.filter((ask) => new BigNumber(ask.price).lte(max)),
                    bids: bids.filter((bid) => new BigNumber(bid.price).gte(min))
                };
            }

            _updateGraphAccordingToOrderBook(orderBook) {
                if (TradeGraph._areEitherAsksOrBids(orderBook)) {
                    this._prepareGraphForOrders(orderBook);
                } else {
                    this._hideGraphAndShowStub();
                }

                return orderBook;
            }

            _prepareGraphForOrders(orderBook) {
                this._showGraphAndHideStub();

                if (TradeGraph._areEnoughAsks(orderBook) && TradeGraph._areEnoughBids(orderBook)) {
                    this._setGraphToShowAsksAndBids();
                }

                if (TradeGraph._isLackOfAsks(orderBook)) {
                    this._setGraphToShowOnly(ORDERS_TYPES.bids);
                }

                if (TradeGraph._isLackOfBids(orderBook)) {
                    this._setGraphToShowOnly(ORDERS_TYPES.asks);
                }
            }

            _showGraphAndHideStub() {
                this.canShowGraph = true;
            }

            _setGraphToShowAsksAndBids() {
                this._updateGraphSeriesOptions([
                    SERIES_SETTINGS.asks,
                    SERIES_SETTINGS.bids
                ]);
            }

            _setGraphToShowOnly(orderType) {
                this._updateGraphSeriesOptions([
                    SERIES_SETTINGS[orderType]
                ]);
            }

            _hideGraphAndShowStub() {
                this._updateGraphSeriesOptions([]);
                this.canShowGraph = false;
            }

            _updateGraphSeriesOptions(seriesOptions) {
                this.options.series = seriesOptions;
            }

            static _areEitherAsksOrBids(orderBook) {
                return TradeGraph._areEnoughAsks(orderBook) || TradeGraph._areEnoughBids(orderBook);
            }

            static _areEnoughAsks(orderBook) {
                return !TradeGraph._isLackOfAsks(orderBook);
            }

            static _areEnoughBids(orderBook) {
                return !TradeGraph._isLackOfBids(orderBook);
            }

            static _isLackOfAsks(orderBook) {
                return TradeGraph._isLackOf(orderBook, ORDERS_TYPES.asks);
            }

            static _isLackOfBids(orderBook) {
                return TradeGraph._isLackOf(orderBook, ORDERS_TYPES.bids);
            }

            static _isLackOf(orderBook, ordersType) {
                return orderBook[ordersType].length < THRESHOLD_VALUES[ordersType];
            }

            static _buildCumulativeOrderBook({ asks, bids }) {
                return {
                    asks: TradeGraph._buildCumulativeOrderList(asks),
                    bids: TradeGraph._buildCumulativeOrderList(bids)
                };
            }

            static _buildCumulativeOrderList(list) {
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

    controller.$inject = ['Base', 'utils', 'waves', 'createPoll', '$scope'];

    angular.module('app.dex')
        .component('wDexTradeGraph', {
            templateUrl: 'modules/dex/directives/tradeGraph/tradeGraph.html',
            controller
        });
})();

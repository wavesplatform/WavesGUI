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
            color: '#e5494d',
            type: ['line', 'area']
        },
        bids: {
            dataset: ORDERS_TYPES.bids,
            key: 'amount',
            label: 'Bids',
            color: '#5a81ea',
            type: ['line', 'area']
        }
    };
    const ORDER_LIST_STUB = [{ amount: 0, price: 0 }];
    const THRESHOLD_VALUES = {
        asks: 2,
        bids: 2
    };

    const tsUtils = require('ts-utils');

    /**
     * @param Base
     * @param utils
     * @param {Waves} waves
     * @param {IPollCreate} createPoll
     * @param {$rootScope.Scope} $scope
     * @param {app.utils} utils
     * @return {TradeGraph}
     */
    const controller = function (Base, utils, waves, createPoll, $scope) {

        class TradeGraph extends Base {

            constructor() {
                super();

                /**
                 * @type {boolean}
                 */
                this.loadingError = false;
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
                 * @type {Signal<void>}
                 * @private
                 */
                this._setDataSignal = new tsUtils.Signal();

                /**
                 * @type {boolean}
                 * @private
                 */
                this.canShowGraph = false;
                /**
                 * @type {boolean}
                 */
                this.pending = true;

                this.options = {
                    margin: {
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0
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
                this._poll = createPoll(this, this._getOrderBook, this._setOrderBook, 1000, { $scope });

                this._resetPending();
            }

            _onChangeAssets(noRestart) {
                if (!noRestart) {
                    this._poll.restart();
                    this._resetPending();
                }
            }

            _resetPending() {
                this.pending = true;
                this.receiveOnce(this._setDataSignal, () => {
                    this.pending = false;
                });
            }

            _getOrderBook() {
                return (waves.matcher
                    .getOrderBook(this._assetIdPair.amount, this._assetIdPair.price)
                    .then((orderBook) => this._cutOffOutlyingOrdersIfNecessary(orderBook))
                    .then(TradeGraph._buildCumulativeOrderBook)
                    .then(data => {
                        this.loadingError = false;
                        return data;
                    })
                    .catch(() => {
                        this.loadingError = true;
                        this.pending = false;
                        $scope.$apply();
                    }));
            }

            _setOrderBook(orderBook) {
                this._updateGraphAccordingToOrderBook(orderBook);
                this.data.asks = orderBook.asks;
                this.data.bids = orderBook.bids;

                this._setDataSignal.dispatch();

                $scope.$digest();
            }

            _cutOffOutlyingOrdersIfNecessary(orderBook) {
                if (TradeGraph._isLackOfAsks(orderBook) || TradeGraph._isLackOfBids(orderBook)) {
                    return orderBook;
                }

                const filteredOrderBook = utils.filterOrderBookByCharCropRate({
                    chartCropRate: this._chartCropRate,
                    asks: orderBook.asks,
                    bids: orderBook.bids
                });

                if (TradeGraph._areEitherAsksOrBids(filteredOrderBook)) {
                    return filteredOrderBook;
                }

                return orderBook;
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
                let amount = new BigNumber(0);

                return list.reduce((result, item) => {
                    amount = amount.add(new BigNumber(item.amount));
                    result.push({
                        amount: Number(amount.toFixed(this._chartCropRate)),
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

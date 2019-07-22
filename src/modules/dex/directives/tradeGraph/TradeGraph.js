(function () {
    'use strict';

    const ORDERS_TYPES = {
        asks: 'asks',
        bids: 'bids'
    };
    const COLORS = {
        lineColor: {
            asks: '#e5494d',
            bids: '#1f5af6'
        },
        fillColor: {
            asks: '#ffe4e4',
            bids: '#EAF0FE'
        }
    };
    const ORDER_LIST_STUB = [{ amount: 0, price: 0 }];
    const THRESHOLD_VALUES = {
        asks: 2,
        bids: 2
    };

    const { Signal } = require('ts-utils');
    const { BigNumber } = require('@waves/bignumber');

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

        /**
         * @class TradeGraph
         * @extends Base
         */
        class TradeGraph extends Base {

            /**
                 * @type {boolean}
                 */
            loadingError = false;
            /**
             * @type {{amount: string, price: string}}
             * @private
             */
            _assetIdPair = null;

            /**
             * @type {number}
             * @private
             */
            _chartCropRate = null;
            /**
             * @type {Signal<void>}
             * @private
             */
            _setDataSignal = new Signal();

            /**
             * @type {boolean}
             * @private
             */
            canShowGraph = false;
            /**
             * @type {boolean}
             */
            pending = true;

            /**
             * @type {TChartOptions}
             */
            options = {
                axisX: 'price',
                axisY: 'amount',
                marginBottom: 0,
                hasDates: false,
                checkWidth: true,
                view: {
                    asks: {
                        lineColor: COLORS.lineColor.asks,
                        fillColor: COLORS.fillColor.asks,
                        lineWidth: 4
                    },
                    bids: {
                        lineColor: COLORS.lineColor.bids,
                        fillColor: COLORS.fillColor.bids,
                        lineWidth: 4
                    }
                }
            };

            chartPlateOptions = COLORS.lineColor;

            /**
             * @type {object<string, TChartData[]>}
             */
            data = {
                asks: ORDER_LIST_STUB,
                bids: ORDER_LIST_STUB
            };

            constructor() {
                super();

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

            onMouse(chartData) {
                const id = chartData.id;
                const { xValue, yValue } = chartData.point;

                this.chartEvent = {
                    ...chartData,
                    id: `${id[0].toUpperCase()}${id.substring(1)}`,
                    amount: new BigNumber(yValue).toFormat(),
                    price: new BigNumber(xValue).toFormat()
                };
            }

            /**
             * @param {boolean} noRestart
             * @private
             */
            _onChangeAssets(noRestart) {
                if (!noRestart) {
                    this._poll.restart();
                    this._resetPending();
                }
            }

            /**
             * @private
             */
            _resetPending() {
                this.pending = true;
                this.receiveOnce(this._setDataSignal, () => {
                    this.pending = false;
                });
            }

            /**
             * @private
             */
            _getOrderBook() {
                return waves.matcher.getOrderBook(this._assetIdPair.amount, this._assetIdPair.price)
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
                    });
            }

            _setOrderBook(orderBook) {
                this._updateGraphAccordingToOrderBook(orderBook);
                this.data = {
                    asks: orderBook.asks,
                    bids: orderBook.bids
                };

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
                    this.canShowGraph = true;
                } else {
                    this.canShowGraph = false;
                }

                return orderBook;
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

/**
 * @typedef {object} TChartOptions
 * @property {string} axisX
 * @property {string} axisY
 * @property {number} marginBottom
 * @property {boolean} hasDates
 * @property {boolean | number} checkWidth
 * @property {TView} view
 */

/**
 * @typedef {Object<string, IView>} TView
 */

/**
 * @typedef {object} IView
 * @property {string} fillColor
 * @property {string} lineColor
 * @property {number} lineWidth
 */

/**
 * @typedef {object} TChartData
 * @property {number} amount
 * @property {number} price
 */

(function () {
    'use strict';

    const ORDERS_TYPES = {
        asks: 'asks',
        bids: 'bids'
    };
    const ORDER_LIST_STUB = [{ amount: 0, price: 0 }];
    const THRESHOLD_VALUES = {
        asks: 2,
        bids: 2
    };
    const COLORS = {
        default: {
            lineColor: {
                asks: '#e5494d',
                bids: '#1f5af6'
            },
            fillColor: {
                asks: '#ffe4e4',
                bids: '#eaf0fe'
            }
        },
        black: {
            lineColor: {
                asks: '#e5494d',
                bids: '#5a81ea'
            },
            fillColor: {
                asks: 'rgba(229, 73, 77, 0.15)',
                bids: 'rgba(90, 129, 234, 0.15)'
            }
        }
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
     * @param {User} user
     * @return {TradeGraph}
     */
    const controller = function (Base, utils, waves, createPoll, $scope, user) {

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
                        lineColor: COLORS.default.lineColor.asks,
                        fillColor: COLORS.default.fillColor.asks,
                        lineWidth: 4
                    },
                    bids: {
                        lineColor: COLORS.default.lineColor.bids,
                        fillColor: COLORS.default.fillColor.bids,
                        lineWidth: 4
                    }
                }
            };
            /**
             * @type {object}
             */
            chartPlateOptions = {};
            /**
             * @type {string}
             */
            theme = 'default';
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
                    _chartCropRate: 'dex.chartCropRate',
                    theme: 'theme'
                });
                this.observe(['_assetIdPair', '_chartCropRate'], this._onChangeAssets);
                /**
                 * @type {Poll}
                 * @private
                 */
                this._poll = createPoll(this, this._getOrderBook, this._setOrderBook, 1000, { $scope });
                this._resetPending();

                this.theme = user.getSetting('theme');
                this._setChartPlateOptions();
                this._setChartOptionsView();
                this.observe('theme', this._onThemeChange);
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
                this.canShowGraph = !!TradeGraph._areEitherAsksOrBids(orderBook);
                return orderBook;
            }

            _setChartOptionsView() {
                this.options = {
                    ...this.options,
                    view: this._getViewOptions()
                };
            }

            _getViewOptions() {
                switch (this.theme) {
                    case 'black':
                        return ({
                            asks: {
                                lineColor: COLORS[this.theme].lineColor.asks,
                                fillColor: COLORS[this.theme].fillColor.asks,
                                lineWidth: 2
                            },
                            bids: {
                                lineColor: COLORS[this.theme].lineColor.bids,
                                fillColor: COLORS[this.theme].fillColor.bids,
                                lineWidth: 2
                            }
                        });
                    default:
                        return ({
                            asks: {
                                lineColor: COLORS.default.lineColor.asks,
                                fillColor: COLORS.default.fillColor.asks,
                                lineWidth: 4
                            },
                            bids: {
                                lineColor: COLORS.default.lineColor.bids,
                                fillColor: COLORS.default.fillColor.bids,
                                lineWidth: 4
                            }
                        });
                }
            }

            _setChartPlateOptions() {
                switch (this.theme) {
                    case 'black':
                        this.chartPlateOptions = {
                            ...this.chartPlateOptions,
                            markerColors: COLORS[this.theme].lineColor
                        };
                        break;
                    default:
                        this.chartPlateOptions = {
                            ...this.chartPlateOptions,
                            markerColors: COLORS.default.lineColor
                        };
                }

            }

            _onThemeChange() {
                utils.wait(1000).then(() => {
                    this._setChartOptionsView();
                    this._setChartPlateOptions();
                });
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

    controller.$inject = ['Base', 'utils', 'waves', 'createPoll', '$scope', 'user'];

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

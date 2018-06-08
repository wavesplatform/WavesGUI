/* global BigNumber, tsUtils */
(function () {
    'use strict';

    /**
     *
     * @param {Base} Base
     * @param {IPollCreate} createPoll
     * @param {JQuery} $element
     * @param {Waves} waves
     * @param {DexDataService} dexDataService
     * @param {app.utils} utils
     * @param {$rootScope.Scope} $scope
     * @param {function(path: string): Promise<string>} $templateRequest
     * @param {DataFeed} dataFeed
     * @return {OrderBook}
     */
    const controller = function (Base, createPoll, $element, waves, dexDataService, utils, $scope, $templateRequest,
                                 dataFeed) {

        const SECTIONS = {
            ASKS: '.asks',
            INFO: '.info',
            BIDS: '.bids',
            SCROLLBOX: 'w-scroll-box',
            LAST_PRICE: '.last-price',
            SPREAD: '.spread'
        };

        const CLASSES = {
            SELL: 'sell',
            BUY: 'buy'
        };

        class OrderBook extends Base {

            constructor() {
                super();
                /**
                 * @type {object}
                 */
                this.orders = null;
                /**
                 * @type {Asset}
                 */
                this.amountAsset = null;
                /**
                 * @type {Asset}
                 */
                this.priceAsset = null;
                /**
                 * @type {boolean}
                 */
                this.pending = true;
                /**
                 * @type {boolean}
                 */
                this.hasOrderBook = false;
                /**
                 * @type {{amount: string, price: string}}
                 * @private
                 */
                this._assetIdPair = null;
                /**
                 * @type {boolean}
                 * @private
                 */
                this._showSpread = true;
                /**
                 * @type {*}
                 * @private
                 */
                this._lastResopse = null;
                /**
                 * @type {boolean}
                 * @private
                 */
                this._noRender = false;
                /**
                 * @type {number}
                 * @private
                 */
                this._orderBookCropRate = null;
                /**
                 * @type {function(data: object): string}
                 * @private
                 */
                this._template = null;
                /**
                 * @private
                 */
                this._dom = null;

                this.receive(dexDataService.showSpread, () => {
                    this._dom.$box.stop().animate({ scrollTop: this._getSpreadScrollPosition() }, 300);
                });

                this.syncSettings({
                    _assetIdPair: 'dex.assetIdPair',
                    _orderBookCropRate: 'dex.orderBookCropRate'
                });

                this.observe(['hasOrderBook', 'pending'], this._onChangeVisibleElements);

                this._onChangeVisibleElements();
                this._updateAssetData();

                $templateRequest('modules/dex/directives/orderBook/orderbook.row.hbs')
                    .then((templateString) => {

                        this._template = Handlebars.compile(templateString);

                        const poll = createPoll(this, this._getOrders, this._setOrders, 1000, { $scope });

                        this.observe('_assetIdPair', () => {
                            this._showSpread = true;
                            this.pending = true;
                            this.hasOrderBook = false;
                            this._updateAssetData();
                            poll.restart();
                        });

                        $element.on('mousedown touchstart', 'w-scroll-box w-row', () => {
                            this._noRender = true;
                        });

                        $element.on('mouseup touchend', 'w-scroll-box w-row', () => {
                            this._noRender = false;
                            if (this._lastResopse) {
                                this._render(this._lastResopse);
                                this._lastResopse = null;
                            }
                        });

                        $element.on('click', 'w-scroll-box w-row', (e) => {
                            const amount = e.currentTarget.getAttribute('data-amount');
                            const price = e.currentTarget.getAttribute('data-price');
                            const type = e.currentTarget.getAttribute('data-type');

                            if (amount && price && type) {
                                dexDataService.chooseOrderBook.dispatch({ amount, price, type });
                            }
                        });
                    });
            }

            $postLink() {
                this._dom = Object.create(null);
                Object.defineProperties(this._dom, {
                    $box: { get: () => $element.find(SECTIONS.SCROLLBOX) },
                    $bids: { get: () => this._dom.$box.find(SECTIONS.BIDS) },
                    $asks: { get: () => this._dom.$box.find(SECTIONS.ASKS) },
                    $info: { get: () => this._dom.$box.find(SECTIONS.INFO) },
                    $lastPrice: { get: () => this._dom.$info.find(SECTIONS.LAST_PRICE) },
                    $spread: { get: () => this._dom.$info.find(SECTIONS.SPREAD) }
                });
            }

            _onChangeVisibleElements() {
                const hasOrderBook = this.hasOrderBook;
                const pending = this.pending;

                if (pending) {
                    $element.removeClass('has-order-book').addClass('pending');
                } else {
                    $element.removeClass('pending').toggleClass('has-order-book', hasOrderBook);
                }
            }

            _updateAssetData() {
                ds.api.assets.get([this._assetIdPair.price, this._assetIdPair.amount])
                    .then(([priceAsset, amountAsset]) => {
                        this.priceAsset = priceAsset;
                        this.amountAsset = amountAsset;
                    });
            }

            /**
             * @return {Promise<{bids, spread, asks}>}
             * @private
             */
            _getOrders() {
                return Promise.all([
                    waves.matcher.getOrderBook(this._assetIdPair.amount, this._assetIdPair.price),
                    waves.matcher.getOrders(),
                    dataFeed.trades(this._assetIdPair.amount, this._assetIdPair.price)
                ]).then(([orderbook, orders, trades]) => this._remapOrderBook(orderbook, orders, trades));
            }

            /**
             * @param {OrderBook.OrdersData} data
             * @private
             */
            _setOrders(data) {
                this.pending = false;
                this._render(data);
            }

            /**
             *
             * @param {Matcher.IOrderBookResult} orderbook
             * @param {Array<Matcher.IOrder>} orders
             * @param {Array<DataFeed.ITrade>} trades
             * @return {OrderBook.OrdersData}
             * @private
             */
            _remapOrderBook(orderbook, orders, trades) {

                const crop = utils.getOrderBookRangeByCropRate({
                    bids: orderbook.bids,
                    asks: orderbook.asks,
                    chartCropRate: this._orderBookCropRate
                });

                const priceHash = orders.reduce((result, item) => {
                    if (item.isActive) {
                        if (item.amount.asset.id === orderbook.pair.amountAsset.id &&
                            item.price.asset.id === orderbook.pair.priceAsset.id) {
                            result[item.price.getTokens().toFixed(item.price.asset.precision)] = true;
                        }
                    }
                    return result;
                }, Object.create(null));

                const lastTrade = trades[0] || null;
                const bids = OrderBook._sumAllOrders(orderbook.bids, orderbook.pair, 'sell');
                const asks = OrderBook._sumAllOrders(orderbook.asks, orderbook.pair, 'buy');

                return {
                    bids: this._toTemplate(bids, crop, priceHash).join(''),
                    lastTrade,
                    spread: orderbook.spread && orderbook.spread.percent,
                    asks: this._toTemplate(asks.slice().reverse(), crop, priceHash).join('')
                };
            }

            /**
             * @param {OrderBook.OrdersData} data
             * @private
             */
            _render(data) {

                if (this._noRender) {
                    this._lastResopse = data;
                    return null;
                }

                this.hasOrderBook = Boolean(data.bids || data.asks);

                this._dom.$asks.html(data.asks);

                if (data.lastTrade) {
                    const isBuy = data.lastTrade.type === 'buy';
                    const isSell = data.lastTrade.type === 'sell';
                    this._dom.$info.toggleClass(CLASSES.BUY, isBuy).toggleClass(CLASSES.SELL, isSell);
                    this._dom.$lastPrice.text(data.lastTrade.price);
                    if (data.spread) {
                        this._dom.$spread.text(data.spread.toFixed(2));
                    }
                } else {
                    this._dom.$info.removeClass(CLASSES.BUY).removeClass(CLASSES.SELL);
                }

                this._dom.$bids.html(data.bids);

                if (this._showSpread) {
                    this._showSpread = false;
                    const box = this._dom.$box.get(0);
                    box.scrollTop = this._getSpreadScrollPosition();
                }
            }

            _getSpreadScrollPosition() {
                const box = this._dom.$box.get(0);
                const info = this._dom.$info.get(0);
                return info.offsetTop - box.offsetTop - box.clientHeight / 2 + info.clientHeight / 2;
            }

            /**
             * @param {OrderBook.IOrder[]} list
             * @param {OrderBook.ICrop} crop
             * @param {Object.<string, string>} priceHash
             * @return Array<string>
             * @private
             */
            _toTemplate(list, crop, priceHash) {
                const croppedList = list.filter((order) => order.price.gte(crop.min) && order.price.lte(crop.max));
                const maxAmount = OrderBook._getMaxTotalAmount(croppedList) || OrderBook._getMaxTotalAmount(list);

                return list.map((order) => {

                    const hasOrder = !!priceHash[order.price.toFixed(this.priceAsset.precision)];
                    const inRange = order.price.gte(crop.min) && order.price.lte(crop.max);
                    const type = order.type;
                    const totalAmount = order.totalAmount && order.totalAmount.toFixed();
                    const width = order.amount.div(maxAmount).times(100).toFixed(2);
                    const amount = utils.getNiceNumberTemplate(order.amount, this.amountAsset.precision, true);
                    const price = utils.getNiceNumberTemplate(order.price, this.priceAsset.precision, true);
                    const total = utils.getNiceNumberTemplate(order.total, this.priceAsset.precision, true);
                    const priceNum = order.price.toFixed();
                    const totalAmountNum = order.totalAmount && order.totalAmount.toFixed();

                    return this._template({
                        hasOrder,
                        inRange,
                        type,
                        totalAmount,
                        amount,
                        price,
                        total,
                        width,
                        priceNum,
                        totalAmountNum
                    });
                });
            }

            /**
             * @param {Array<Matcher.IOrder>} list
             * @param {Array<Matcher.IPair>} pair
             * @param {'buy'|'sell'} type
             * @return Array<OrderBook.IOrder>
             * @private
             */
            static _sumAllOrders(list, pair, type) {
                let total = new BigNumber(0);
                let amountTotal = new BigNumber(0);

                return list.map((item) => {
                    total = total.plus(item.total);
                    amountTotal = amountTotal.plus(item.amount);
                    return {
                        type,
                        amount: new BigNumber(item.amount),
                        price: new BigNumber(item.price),
                        total,
                        totalAmount: amountTotal
                    };
                });
            }

            /**
             * @param {Array} orderedList
             * @return {BigNumber}
             * @private
             */
            static _getMaxTotalAmount(orderedList) {
                if (orderedList.length) {
                    return BigNumber.max(
                        orderedList[0].totalAmount || 0,
                        orderedList[orderedList.length - 1].totalAmount || 0
                    );
                }
                return null;
            }

        }

        return new OrderBook();
    };

    controller.$inject = [
        'Base',
        'createPoll',
        '$element',
        'waves',
        'dexDataService',
        'utils',
        '$scope',
        '$templateRequest',
        'dataFeed'
    ];

    angular.module('app.dex').component('wDexOrderBook', {
        templateUrl: 'modules/dex/directives/orderBook/orderBook.html',
        controller
    });
})();

/**
 * @name OrderBook
 */

/**
 * @typedef {object} OrderBook#IOrder
 * @property {BigNumber} price
 * @property {BigNumber} amount
 * @property {BigNumber} total
 * @property {BigNumber} totalAmount
 * @property {'sell'|'buy'} type
 */

/**
 * @typedef {object} OrderBook#ICrop
 * @property {number} min
 * @property {number} max
 */

/**
 * @typedef {object} OrderBook#OrdersData
 * @property {string} asks
 * @property {string} bids
 * @property {DataFeed.ITrade} lastTrade
 * @property {BigNumber} spread
 */

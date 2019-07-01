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
     * @param {app.i18n} i18n
     * @param {typeof OrderList} OrderList
     * @param {Transactions} transactions
     * @return {OrderBook}
     */
    const controller = function (Base,
                                 createPoll,
                                 $element,
                                 waves,
                                 dexDataService,
                                 utils,
                                 $scope,
                                 i18n,
                                 OrderList,
                                 transactions) {

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

        const ds = require('data-service');
        const { BigNumber } = require('@waves/bignumber');
        const { AssetPair } = require('@waves/data-entities');

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
                 * @type {boolean}
                 */
                this.loadingError = false;
                /**
                 * @type {{amount: string, price: string}}
                 * @private
                 */
                this._assetIdPair = null;
                /**
                 * @type {*}
                 * @private
                 */
                this._lastResponse = null;
                /**
                 * @type {boolean}
                 * @private
                 */
                this._showSpread = true;
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
                 * @private
                 */
                this._dom = null;
                /**
                 * @type {boolean}
                 * @public
                 */
                this.isScrolled = false;

                this.receive(dexDataService.showSpread, () => {
                    this._dom.$box.stop().animate({ scrollTop: this._getSpreadScrollPosition() }, 300);
                });

                this.syncSettings({
                    _assetIdPair: 'dex.assetIdPair',
                    _orderBookCropRate: 'dex.chartCropRate'
                });

                this.observe(['hasOrderBook'], this._onChangeVisibleElements);

                this._onChangeVisibleElements();
                this._updateAssetData();
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

                this._dom.$box.on('scroll', () => {
                    const scrollPos = this._dom.$box[0].scrollTop;
                    const spreadPos = this._getSpreadScrollPosition();
                    this.isScrolled = Math.abs(scrollPos - spreadPos) >= 2;
                });


                const poll = createPoll(this, this._getOrders, this._setOrders, 1000, { $scope });

                this.observe('_assetIdPair', () => {
                    this._showSpread = true;
                    this.pending = true;
                    this.hasOrderBook = false;
                    this.loadingError = false;
                    this._updateAssetData();
                    poll.restart();
                });

                $element.on('mousedown touchstart', 'w-scroll-box w-row', () => {
                    this._noRender = true;
                });

                $element.on('mouseup touchend', 'w-scroll-box w-row', () => {
                    this._noRender = false;
                    if (this._lastResponse) {
                        this._render(this._lastResponse);
                        this._lastResponse = null;
                    }
                });

                this._asks = new OrderList({
                    node: this._dom.$asks.get(0),
                    fillColor: 'rgba(229,73,77,0.1)'
                });
                this._bids = new OrderList({
                    node: this._dom.$bids.get(0),
                    fillColor: 'rgba(90,129,234,0.1)'
                });

                this.signals.destroy.once(() => {
                    this._asks.$onDestroy();
                    this._bids.$onDestroy();
                });
            }

            nothingFound() {
                return !(this.hasOrderBook || this.pending || this.loadingError);
            }

            /**
             * @private
             */
            _updateAssetData() {
                ds.api.assets.get([this._assetIdPair.price, this._assetIdPair.amount])
                    .then(([priceAsset, amountAsset]) => {
                        this.priceAsset = priceAsset;
                        this.amountAsset = amountAsset;
                        this.pair = new AssetPair(amountAsset, priceAsset);
                    });
            }

            /**
             * @return {Promise<{bids, spread, asks}>}
             * @private
             */
            _getOrders() {
                const amountAsset = this._assetIdPair.amount;
                const priceAsset = this._assetIdPair.price;
                const limit = 1;

                return Promise.all([
                    waves.matcher.getOrderBook(amountAsset, priceAsset),
                    waves.matcher.getOrders().catch(() => null),
                    ds.api.pairs.get(amountAsset, priceAsset)
                        .then(waves.matcher.getLastPrice)
                        .catch(() => null)
                        .then(lastPrice => {
                            const tokens = lastPrice.price.getTokens();
                            if (tokens.isNaN()) {
                                return transactions
                                    .getExchangeTxList({ amountAsset, priceAsset, limit })
                                    .then(([tx]) => ({ price: tx.price, lastSide: tx.exchangeType }))
                                    .catch(() => null);
                            }
                            return lastPrice;
                        })
                        .then(lastPrice => lastPrice)
                        .catch(() => null)
                ])
                    .then(([orderbook, orders, lastPrice]) => {
                        this.loadingError = false;
                        return this._remapOrderBook(orderbook, orders, lastPrice);
                    })
                    .catch(() => {
                        this.loadingError = true;
                        this.hasOrderBook = false;
                        $scope.$digest();
                    });
            }

            /**
             * @private
             */
            _onChangeVisibleElements() {
                $element.toggleClass('has-order-book', this.hasOrderBook);
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
             * @param {Array<{price: Money, lastSide: string}>} lastPrice
             * @return {OrderBook.OrdersData}
             * @private
             */
            _remapOrderBook(orderbook, orders = [], lastPrice) {

                const dataBids = orderbook.bids.slice(0, OrderList.ROWS_COUNT);
                const dataAsks = orderbook.asks.slice(0, OrderList.ROWS_COUNT);

                const crop = utils.getOrderBookRangeByCropRate({
                    bids: dataBids,
                    asks: dataAsks,
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

                const lastTrade = lastPrice;
                const bids = OrderBook._sumAllOrders(dataBids, 'sell');
                const asks = OrderBook._sumAllOrders(dataAsks, 'buy').reverse();

                const maxAmount = OrderBook._getMaxAmount(bids, asks, crop);

                return {
                    bids,
                    maxAmount,
                    priceHash,
                    crop,
                    lastTrade,
                    spread: orderbook.spread && orderbook.spread.percent,
                    asks
                };
            }

            /**
             * @param {OrderBook.OrdersData} data
             * @private
             */
            _render(data) {
                if (!data) {
                    return null;
                }

                if (this._noRender) {
                    this._lastResponse = data;
                    return null;
                }

                this.hasOrderBook = Boolean(data.bids.length || data.asks.length);

                if (data.lastTrade) {
                    const isBuy = data.lastTrade.lastSide === 'buy';
                    const isSell = data.lastTrade.lastSide === 'sell';
                    this._dom.$lastPrice.toggleClass(CLASSES.BUY, isBuy)
                        .toggleClass(CLASSES.SELL, isSell)
                        .text(data.lastTrade.price.toFormat());
                } else {
                    this._dom.$lastPrice.removeClass(CLASSES.BUY)
                        .removeClass(CLASSES.SELL)
                        .text(0);
                }
                this._dom.$spread.text(data.spread && data.lastTrade ? data.spread.toFixed(2) : '');

                const pair = new AssetPair(this.amountAsset, this.priceAsset);

                const toLength = (list, len) => {
                    const count = len - list.length;
                    return new Array(count).fill(null).concat(list);
                };

                const length = OrderList.ROWS_COUNT;
                this._asks.render(toLength(data.asks, length), data.crop, data.priceHash, data.maxAmount, pair);
                this._bids.render(data.bids, data.crop, data.priceHash, data.maxAmount, pair);

                if (this._showSpread) {
                    this._showSpread = false;
                    const box = this._dom.$box.get(0);
                    box.scrollTop = this._getSpreadScrollPosition();
                }
            }

            /**
             * @return {number}
             * @private
             */
            _getSpreadScrollPosition() {
                const box = this._dom.$box.get(0);
                const info = this._dom.$info.get(0);
                return info.offsetTop - box.offsetTop - box.clientHeight / 2 + info.clientHeight / 2;
            }

            /**
             * @param {Array<Matcher.IOrder>} list
             * @param {'buy'|'sell'} type
             * @return Array<OrderBook.IOrder>
             * @private
             */
            static _sumAllOrders(list, type) {
                let total = new BigNumber(0);
                let amountTotal = new BigNumber(0);

                return list.map((item) => {
                    total = total.add(item.total);
                    amountTotal = amountTotal.add(item.amount);
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
             * @param {OrderBook.IOrder[]} bids
             * @param {OrderBook.IOrder[]} asks
             * @param {OrderBook.ICrop} crop
             * @return {BigNumber}
             * @private
             */
            static _getMaxAmount(bids, asks, crop) {
                const croppedBids = OrderBook._cropFilterOrders(bids, crop);
                const croppedAsks = OrderBook._cropFilterOrders(asks, crop);

                const orders = [...croppedBids, ...croppedAsks].sort((a, b) => a.amount.gt(b.amount) ? 1 : -1);

                if (!orders.length) {
                    return new BigNumber(0);
                } else {
                    const percentile = 0.9;
                    return orders[Math.floor(orders.length * percentile)].amount;
                }
            }

            /**
             * @param {OrderBook.IOrder[]} list
             * @param {OrderBook.ICrop} crop
             * @return {OrderBook.IOrder[]}
             * @private
             */
            static _cropFilterOrders(list, crop) {
                return list.filter((o) => o.price.gte(crop.min) && o.price.lte(crop.max));
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
        'i18n',
        'OrderList',
        'transactions'
    ];

    angular.module('app.dex').component('wDexOrderBook', {
        templateUrl: 'modules/dex/directives/orderBook/orderBook.html',
        bindings: {
            isScrolled: '='
        },
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
 * @property {BigNumber} min
 * @property {BigNumber} max
 */

/**
 * @typedef {object} OrderBook#OrdersData
 * @property {Array<OrderBook.IOrder>} bids
 * @property {Array<OrderBook.IOrder>} asks
 * @property {BigNumber} maxAmount
 * @property {OrderBook.ICrop} crop
 * @property {Record<string, boolean>} priceHash
 * @property {{price: Money, lastSide: string}} lastTrade
 * @property {BigNumber} spread
 */

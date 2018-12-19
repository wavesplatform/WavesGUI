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
     * @param {app.i18n} i18n
     * @return {OrderBook}
     */
    const controller = function (Base,
                                 createPoll,
                                 $element,
                                 waves,
                                 dexDataService,
                                 utils,
                                 $scope,
                                 $templateRequest,
                                 i18n) {

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
                    _orderBookCropRate: 'dex.chartCropRate'
                });

                this.observe(['hasOrderBook'], this._onChangeVisibleElements);

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

            nothingFound() {
                return !(this.hasOrderBook || this.pending || this.loadingError);
            }

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

                return Promise.all([
                    waves.matcher.getOrderBook(amountAsset, priceAsset),
                    waves.matcher.getOrders().catch(() => null),
                    ds.api.pairs.get(amountAsset, priceAsset).then(waves.matcher.getLastPrice)
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
             * @param {Array<DataFeed.ITrade>} trades
             * @return {OrderBook.OrdersData}
             * @private
             */
            _remapOrderBook(orderbook, orders = [], lastPrice) {

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

                const lastTrade = lastPrice;
                const bids = OrderBook._sumAllOrders(orderbook.bids, 'sell');
                const asks = OrderBook._sumAllOrders(orderbook.asks, 'buy').reverse();

                const maxAmount = OrderBook._getMaxAmount(bids, asks, crop);

                return {
                    bids: this._toTemplate(bids, crop, priceHash, maxAmount).join(''),
                    lastTrade,
                    spread: orderbook.spread && orderbook.spread.percent,
                    asks: this._toTemplate(asks, crop, priceHash, maxAmount).join('')
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

                this.hasOrderBook = Boolean(data.bids || data.asks);

                this._dom.$asks.html(data.asks);

                if (data.lastTrade) {
                    const isBuy = data.lastTrade.lastSide === 'buy';
                    const isSell = data.lastTrade.lastSide === 'sell';
                    this._dom.$lastPrice.toggleClass(CLASSES.BUY, isBuy)
                        .toggleClass(CLASSES.SELL, isSell)
                        .text(data.lastTrade.price.toFormat());
                    if (data.spread) {
                        this._dom.$spread.text(data.spread.toFixed(2));
                    }
                } else {
                    this._dom.$lastPrice.removeClass(CLASSES.BUY)
                        .removeClass(CLASSES.SELL)
                        .text(0);
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
             * @param {BigNumber} maxAmount
             * @return Array<string>
             * @private
             */
            _toTemplate(list, crop, priceHash, maxAmount) {
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
                    const amountAsset = this.amountAsset.displayName;
                    const priceAsset = this.priceAsset.displayName;
                    const buyTooltip = i18n.translate('orderbook.ask.tooltipText', 'app.dex', {
                        amountAsset, priceAsset, price: order.price.toFormat(this.priceAsset.precision)
                    });
                    const sellTooltip = i18n.translate('orderbook.bid.tooltipText', 'app.dex', {
                        amountAsset, priceAsset, price: order.price.toFormat(this.priceAsset.precision)
                    });

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
                        totalAmountNum,
                        buyTooltip,
                        sellTooltip
                    });
                });
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

            /**
             * @param {OrderBook.IOrder[]} list
             * @return {BigNumber}
             * @private
             */
            static _getMedianAmount(list) {
                const len = list.length;
                const l = len % 2 ? len - 1 : len;
                return list[l / 2].amount;
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
        'i18n'
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
 * @property {{price: Money, lastSide: string}} lastTrade
 * @property {BigNumber} spread
 */

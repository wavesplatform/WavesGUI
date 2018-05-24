(function () {
    'use strict';

    /**
     * @param {app.utils} utils
     * @param {app.utils.decorators} decorators
     * @param {app.i18n} i18n
     * @param {User} user
     * @param {PollCache} PollCache
     * @param orderStatuses
     * @return {Matcher}
     */
    const factory = function (utils, decorators, i18n, user, PollCache, orderStatuses) {

        class Matcher {

            constructor() {

                this._orderBookCacheHash = Object.create(null);

                user.onLogin().then(() => {
                    /**
                     * @type {Promise<Seed>}
                     * @private
                     */
                    this._seedPromise = user.getSeed();
                    /**
                     * @type {PollCache}
                     * @private
                     */
                    this._ordersCache = new PollCache({
                        getData: this._getOrdersData.bind(this),
                        timeout: 2000,
                        isBalance: true
                    });
                });
            }

            createOrder(orderData, keyPair) {
                return Waves.API.Matcher.v1.getMatcherKey().then((matcherPublicKey) => {
                    return Waves.API.Matcher.v1.createOrder({
                        matcherPublicKey,
                        ...orderData
                    }, keyPair);
                });
            }

            /**
             * @return {Promise<Array<IOrder>>}
             */
            getOrders() {
                return this._ordersCache.get();
            }

            /**
             * @param {string} asset1
             * @param {string} asset2
             * @return {Promise<Matcher.IOrderBookResult>}
             */
            getOrderBook(asset1, asset2) {
                return this._getOrderBookCache(asset1, asset2).get();
            }

            cancelOrder(amountAssetId, priceAssetId, orderId, keyPair) {
                return Waves.API.Matcher.v1.cancelOrder(amountAssetId, priceAssetId, orderId, keyPair);
            }

            /**
             * @param keyPair
             * @returns {Promise<any>}
             * @private
             */
            _getOrders(keyPair) {
                return Waves.API.Matcher.v1.getAllOrders(keyPair)
                    .then((list) => list.map(Matcher._remapOrder))
                    .then(utils.whenAll);
            }

            /**
             * @param {string} asset1
             * @param {string} asset2
             * @return {Promise<{bids, asks, pair: IAssetPair, spread: {amount: string, price: string, total: string}}>}
             * @private
             */
            _getOrderBook(asset1, asset2) {
                return Waves.AssetPair.get(asset1, asset2)
                    .then((pair) => Waves.API.Matcher.v1.getOrderbook(pair.amountAsset.id, pair.priceAsset.id)
                        .then((orderBook) => Matcher._remapOrderBook(orderBook, pair))
                        .then(([bids, asks]) => ({ bids, asks, pair, spread: Matcher._getSpread(bids, asks, pair) }))
                    );
            }

            /**
             * @param {string} asset1
             * @param {string} asset2
             * @return {PollCache}
             * @private
             */
            _getOrderBookCache(asset1, asset2) {
                const hash = this._orderBookCacheHash;
                const id = [asset1, asset2].sort(utils.comparators.asc).join('-');
                if (hash[id]) {
                    clearTimeout(hash[id].timer);
                    hash[id].timer = setTimeout(() => {
                        hash[id].cache.destroy();
                        delete hash[id];
                    }, 5000);
                    return hash[id].cache;
                } else {
                    hash[id] = {
                        timer: setTimeout(() => {
                            hash[id].cache.destroy();
                            delete hash[id];
                        }, 5000),
                        cache: new PollCache({
                            getData: () => this._getOrderBook(asset1, asset2),
                            timeout: 1000
                        })
                    };
                    return hash[id].cache;
                }
            }

            /**
             * @returns {Promise<T>}
             * @private
             */
            _getOrdersData() {
                return this._seedPromise.then((seed) => this._getOrders(seed.keyPair));
            }

            /**
             * @param bids
             * @param asks
             * @param pair
             * @returns {Promise<any[]>}
             * @private
             */
            static _remapOrderBook({ bids, asks }, pair) {
                return Promise.all([
                    Matcher._remapBidAsks(bids, pair),
                    Matcher._remapBidAsks(asks, pair)
                ]);
            }

            /**
             * @param list
             * @param pair
             * @returns {Promise<(any[])[]>}
             * @private
             */
            static _remapBidAsks(list, pair) {
                return Promise.all((list || [])
                    .map((item) => Promise.all([
                        Waves.Money.fromCoins(String(item.amount), pair.amountAsset)
                            .then((amount) => amount.getTokens()),
                        Waves.OrderPrice.fromMatcherCoins(String(item.price), pair)
                            .then((orderPrice) => orderPrice.getTokens())
                    ])
                        .then((amountPrice) => {
                            const amount = amountPrice[0];
                            const price = amountPrice[1];
                            const total = amount.mul(price);
                            return {
                                amount: amount.toFixed(pair.amountAsset.precision),
                                price: price.toFixed(pair.priceAsset.precision),
                                total: total.toFixed(pair.priceAsset.precision)
                            };
                        })));
            }

            /**
             * @param order
             * @returns {Promise<*[]>}
             * @private
             */
            static _remapOrder(order) {
                const priceAssetId = Matcher._getAssetId(order.assetPair.priceAsset);
                const amountAssetId = Matcher._getAssetId(order.assetPair.amountAsset);

                return Waves.AssetPair.get(priceAssetId, amountAssetId)
                    .then((assetPair) => Promise.all([
                        Waves.OrderPrice.fromMatcherCoins(String(order.price), assetPair)
                            .then((orderPrice) => Waves.Money.fromTokens(orderPrice.getTokens(), priceAssetId)),
                        Waves.Money.fromCoins(String(order.amount), amountAssetId),
                        Waves.Money.fromCoins(String(order.filled), amountAssetId),
                        Promise.resolve(assetPair)
                    ]))
                    .then(([price, amount, filled, assetPair]) => {
                        const totalAmount = price.getTokens().mul(amount.getTokens());

                        return (
                            Waves
                                .Money
                                .fromTokens(totalAmount, priceAssetId)
                                .then((total) => ({
                                    price,
                                    amount,
                                    total,
                                    filled,
                                    assetPair
                                }))
                        );
                    })
                    .then(({ price, amount, total, filled, assetPair }) => {
                        const percent = filled.getTokens().div(amount.getTokens()).mul(100).round(2); // TODO
                        // TODO Move to component myOrders (dex refactor);
                        const STATUS_MAP = {
                            [orderStatuses.cancelled]: 'matcher.orders.statuses.canceled',
                            [orderStatuses.accepted]: 'matcher.orders.statuses.opened',
                            [orderStatuses.filled]: 'matcher.orders.statuses.filled',
                            [orderStatuses.partiallyFilled]: 'matcher.orders.statuses.filled'
                        };
                        const state = i18n.translate(STATUS_MAP[order.status], 'app', { percent });
                        const isActive = ['Accepted', 'PartiallyFilled'].indexOf(order.status) !== -1;
                        const pair = `${assetPair.amountAsset.displayName} / ${assetPair.priceAsset.displayName}`;

                        return { ...order, isActive, price, amount, total, filled, assetPair, pair, percent, state };
                    });
            }

            /**
             * @param {Array} bids
             * @param {Array} asks
             * @returns {Matcher.ISpread}
             * @private
             */
            static _getSpread(bids, asks) {
                const [lastAsk] = asks;
                const [firstBid] = bids;
                const sell = new BigNumber(firstBid && firstBid.price);
                const buy = new BigNumber(lastAsk && lastAsk.price);
                const percent = (sell && buy && buy.gt(0)) ? buy.sub(sell).mul(100).div(buy) : new BigNumber(0);

                return firstBid && lastAsk && {
                    lastAsk,
                    firstBid,
                    buy,
                    sell,
                    percent
                } || null;
            }

            /**
             * @param id
             * @returns {string}
             * @private
             */
            static _getAssetId(id) {
                return id || WavesApp.defaultAssets.WAVES;
            }

        }

        return new Matcher();
    };

    factory.$inject = ['utils', 'decorators', 'i18n', 'user', 'PollCache', 'orderStatuses'];

    angular.module('app').factory('matcher', factory);
})();

/**
 * @name Matcher
 */

/**
 * @typedef {object} Matcher#IOrderApi
 * @property {string} price
 * @property {string} amount
 */

/**
 * @typedef {object} Matcher#IOrder
 * @property {string} price
 * @property {string} amount
 * @property {string} total
 */

/**
 * @typedef {object} Matcher#IPair
 * @property {string} priceAsset
 * @property {string} amountAsset
 */

/**
 * @typedef {object} Matcher#ISpread
 * @property {Matcher.IOrderApi} lastAsk
 * @property {Matcher.IOrderApi} firstBid
 * @property {BigNumber} buy
 * @property {BigNumber} sell
 * @property {BigNumber} percent
 */

/**
 * @typedef {object} Matcher#IOrderBookResult
 * @property {Array<Matcher.IOrder>} asks
 * @property {Array<Matcher.IOrder>} bids
 * @property {Matcher.IPair} pair
 * @property {Matcher.ISpread} spread
 * @property {number} timestamp
 */

/**
 * @typedef {object} Matcher#IOrder
 * @property {string} id
 * @property {IAssetPair} assetPair
 * @property {Money} filled
 * @property {boolean} isActive
 * @property {string} pair
 * @property {BigNumber} percent
 * @property {Money} price
 * @property {string} state
 * @property {string} status
 * @property {Money} total
 * @property {string} type
 */

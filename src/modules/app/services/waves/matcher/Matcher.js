(function () {
    'use strict';

    /**
     * @param {app.utils} utils
     * @param {app.utils.decorators} decorators
     * @param {app.i18n} i18n
     * @param {User} user
     * @param {PollCache} PollCache
     * @return {Matcher}
     */
    const factory = function (utils, decorators, i18n, user, PollCache) {

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

            getOrders() {
                return this._ordersCache.get();
            }

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
                        Promise.resolve(`${assetPair.amountAsset.displayName} / ${assetPair.priceAsset.displayName}`)
                    ]))
                    .then(([price, amount, filled, pair]) => {
                        const percent = filled.getTokens().div(amount.getTokens()).mul(100).round(2); // TODO
                        // TODO Move to component myOrders (dex refactor);
                        const STATUS_MAP = {
                            Cancelled: 'matcher.orders.statuses.canceled',
                            Accepted: 'matcher.orders.statuses.opened',
                            Filled: 'matcher.orders.statuses.filled',
                            PartiallyFilled: 'matcher.orders.statuses.filled'
                        };
                        const state = i18n.translate(STATUS_MAP[order.status], 'app', { percent });
                        const isActive = ['Accepted', 'PartiallyFilled'].indexOf(order.status) !== -1;

                        return { ...order, isActive, price, amount, filled, pair, percent, state };
                    });
            }

            /**
             * @param {Array} bids
             * @param {Array} asks
             * @param {AssetPair} pair
             * @returns {{amount: string, price: string, total: string}}
             * @private
             */
            static _getSpread(bids, asks, pair) {
                const [lastAsk] = asks;
                const [firstBid] = bids;

                return firstBid && lastAsk && {
                    amount: lastAsk.price,
                    price: new BigNumber(lastAsk.price).sub(firstBid.price)
                        .abs()
                        .toFixed(pair.priceAsset.precision),
                    total: firstBid.price
                } || { amount: '0', price: '0', total: '0' };
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

    factory.$inject = ['utils', 'decorators', 'i18n', 'user', 'PollCache'];

    angular.module('app').factory('matcher', factory);
})();

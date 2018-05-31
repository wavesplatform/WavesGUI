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
            }

            getOrders() {
                return ds.dataManager.getOrders();
            }

            getOrderBook(asset1, asset2) {
                return this._getOrderBookCache(asset1, asset2).get();
            }

            /**
             * @param {string} asset1
             * @param {string} asset2
             * @return {Promise<{bids, asks, pair: IAssetPair, spread: {amount: string, price: string, total: string}}>}
             * @private
             */
            _getOrderBook(asset1, asset2) {
                return ds.api.assets.getAssetPair(asset1, asset2)
                    .then((pair) => ds.api.matcher.getOrderBook(pair.amountAsset.id, pair.priceAsset.id)
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
                        ds.moneyFromCoins(String(item.amount), pair.amountAsset)
                            .then((amount) => amount.getTokens()),
                        ds.orderPriceFromCoins(String(item.price), pair)
                            .then((orderPrice) => orderPrice.getTokens())
                    ])
                        .then((amountPrice) => {
                            const amount = amountPrice[0];
                            const price = amountPrice[1];
                            const total = amount.times(price);
                            return {
                                amount: amount.toFixed(pair.amountAsset.precision),
                                price: price.toFixed(pair.priceAsset.precision),
                                total: total.toFixed(pair.priceAsset.precision)
                            };
                        })));
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
                    price: new BigNumber(lastAsk.price).minus(firstBid.price)
                        .abs()
                        .toFixed(pair.priceAsset.precision),
                    total: firstBid.price
                } || { amount: '0', price: '0', total: '0' };
            }

        }

        return new Matcher();
    };

    factory.$inject = ['utils', 'decorators', 'i18n', 'user', 'PollCache'];

    angular.module('app').factory('matcher', factory);
})();

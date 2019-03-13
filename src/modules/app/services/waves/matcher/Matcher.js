(function () {
    'use strict';

    const ds = require('data-service');
    const { BigNumber, Money } = require('@waves/data-entities');
    const { currentCreateOrderFactory } = require('@waves/signature-adapter');
    const generator = require('@waves/signature-generator');

    /**
     * @param {app.utils} utils
     * @param {app.utils.decorators} decorators
     * @param {app.i18n} i18n
     * @param {User} user
     * @param {PollCache} PollCache
     * @param {ConfigService} configService
     * @return {Matcher}
     */
    const factory = function (utils, decorators, i18n, user, PollCache, configService) {

        class Matcher {

            constructor() {

                this._orderBookCacheHash = Object.create(null);
            }

            /**
             * @return {Promise<Array<IOrder>>}
             */
            @decorators.cachable(1)
            getOrders() {
                if (user.address) {
                    return ds.api.matcher.getOrders().then(ds.processOrdersWithStore);
                } else {
                    return Promise.resolve([]);
                }
            }

            /**
             * @param {AssetPair} pair
             * @return {Promise<{price: Money, lastSide: string}r>}
             */
            @decorators.cachable(0.5)
            getLastPrice(pair) {
                return ds.api.matcher.getLastPrice(pair);
            }

            /**
             * @param {string} address
             * @return {Promise<IScriptInfo<Money>>}
             */
            @decorators.cachable(2)
            _scriptInfo(address) {
                return ds.api.address.getScriptInfo(address);
            }

            /**
             * @param order
             * @return {Promise<Money>}
             */
            getCreateOrderFee(order) {
                const config = configService.getFeeConfig();
                return this.getMinOrderFee()
                    .then(minFee => {
                        const currentFee = currentCreateOrderFactory(config, minFee);
                        const publicKeyBytes = generator.libs.base58.decode(order.matcherPublicKey);
                        const matcherAddress = generator.utils.crypto.buildRawAddress(publicKeyBytes);

                        return Promise.all([
                            this._scriptInfo(matcherAddress),
                            ds.api.assets.get('WAVES')
                        ]).then(([info, asset]) => ({
                            asset,
                            hasScript: info.extraFee.getTokens().gt(0),
                            currentFee
                        }));
                    })
                    .then(({ hasScript, currentFee, asset }) => {
                        const smartAssetIdList = [order.amount.asset, order.price.asset]
                            .filter(asset => asset.hasScript)
                            .map(asset => asset.id);
                        const fee = currentFee({
                            assetPair: {
                                amountAsset: order.amount.asset.id,
                                priceAsset: order.price.asset.id
                            },
                            matcherPublicKey: order.matcherPublicKey
                        }, hasScript, smartAssetIdList);

                        return new Money(fee, asset);
                    });
            }

            /**
             * @return {Promise<BigNumber>}
             */
            getMinOrderFee() {
                return Promise.resolve(new BigNumber(300000));
            }

            /**
             * @param {string} asset1
             * @param {string} asset2
             * @return {Promise<Matcher.IOrderBookResult>}
             */
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
                return ds.api.matcher.getOrderBook(asset1, asset2)
                    .then((orderBook) => Matcher._remapOrderBook(orderBook))
                    .then(({ bids, asks, pair }) => ({
                        bids,
                        asks,
                        pair,
                        spread: Matcher._getSpread(bids, asks, pair)
                    }));
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
                    }, 2000);
                    return hash[id].cache;
                } else {
                    hash[id] = {
                        timer: setTimeout(() => {
                            hash[id].cache.destroy();
                            delete hash[id];
                        }, 2000),
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
            static _remapOrderBook({ bids, asks, pair }) {
                return {
                    pair,
                    bids: Matcher._remapBidAsks(bids, pair),
                    asks: Matcher._remapBidAsks(asks, pair)
                };
            }

            /**
             * @param list
             * @param pair
             * @returns {Promise<(any[])[]>}
             * @private
             */
            static _remapBidAsks(list, pair) {
                return (list || []).map((item) => {
                    const amount = item.amount.getTokens();
                    const price = item.price.getTokens();
                    const total = amount.times(price);

                    return {
                        amount: amount.toFixed(pair.amountAsset.precision),
                        price: price.toFixed(pair.priceAsset.precision),
                        total: total.toFixed(pair.priceAsset.precision)
                    };
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
                const percent = (buy.gt(0)) ? buy.minus(sell).times(100).div(buy) : new BigNumber(0);

                return firstBid && lastAsk && {
                    lastAsk,
                    firstBid,
                    buy,
                    sell,
                    percent
                } || null;
            }

        }

        return new Matcher();
    };

    factory.$inject = ['utils', 'decorators', 'i18n', 'user', 'PollCache', 'configService'];

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

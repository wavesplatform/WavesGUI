(function () {
    'use strict';

    const ds = require('data-service');
    const { Money } = require('@waves/data-entities');
    const { BigNumber } = require('@waves/bignumber');
    const { currentCreateOrderFactory } = require('@waves/signature-adapter');
    const { libs } = require('@waves/waves-transactions');
    const { address } = libs.crypto;

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

        /**
         * @class
         */
        class Matcher {

            /**
             * @type {string}
             */
            currentMatcherAddress = '';

            constructor() {
                this._orderBookCacheHash = Object.create(null);

                user.onLogin().then(() => {
                    user.changeSetting.on((path) => {
                        if (path === 'network.matcher') {
                            this._updateCurrentMatcherAddress();
                        }
                    });
                });

                this._updateCurrentMatcherAddress();
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
                    const total = amount.mul(price);

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
                const percent = (buy.gt(0)) ? buy.sub(sell).mul(100).div(buy) : new BigNumber(0);

                return firstBid && lastAsk && {
                    lastAsk,
                    firstBid,
                    buy,
                    sell,
                    percent
                } || null;
            }

            /**
             * @return {Promise<Array<IOrder>>}
             */
            @decorators.cachable(1)
            getOrders(options) {
                if (user.address) {
                    return ds.api.matcher.getOrders(options).then(ds.processOrdersWithStore);
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
                        const matcherAddress = address({ public: order.matcherPublicKey }, WavesApp.network.code);

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
             * @param {object} order
             * @return {object}
             */
            calculateCustomFeeMap(order) {
                const smartAssetExtraFee = new BigNumber(configService.getFeeConfig().smart_asset_extra_fee);
                const baseFee = new BigNumber(order.baseFee);
                const hasScript = order.matcherInfo.extraFee.getTokens().gt(0);
                const smartPairAssets = [order.pair.amountAsset, order.pair.priceAsset]
                    .filter(asset => asset.hasScript);

                const getSmartAssetsQuantity = (feeAsset) => {
                    const feeIsSmartAndNotInPair =
                        feeAsset.hasScript &&
                        (smartPairAssets.some(asset => asset.id === feeAsset.id));
                    return smartPairAssets.length + Number(feeIsSmartAndNotInPair);
                };

                const feeMap = order.feeAssets.reduce((acc, asset) => {
                    acc[asset.id] = baseFee
                        .add(smartAssetExtraFee.mul(getSmartAssetsQuantity(asset)))
                        .add(smartAssetExtraFee.mul(Number(hasScript)));
                    return acc;
                }, Object.create(null));

                return feeMap;

                // const feeMap = order.feeAssets.reduce((acc, asset) => {
                //     acc[asset.id] = baseFee.add(smartAssetExtraFee * getSmartAssetsQuantity(asset));
                //     return acc;
                // }, Object.create(null));
                //
                // return feeMap;
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
             * @return {Promise<Matcher.IFeeMap>}
             */
            @decorators.cachable(5)
            getFeeRates() {
                return ds.api.matcher.getFeeRates();
            }

            /**
             * @return {Promise<object>}
             */
            getSettings() {
                return ds.api.matcher.getSettings();
            }

            /**
             * @param pair
             * @param matcherPublicKey
             * @return {Promise<object | never>}
             */
            getCreateOrderSettings(pair, matcherPublicKey) {
                return this.getSettings()
                    .then(data => {
                        const matcherPublicKeyBytes = libs.crypto.base58Decode(matcherPublicKey);
                        const matcherAddress = libs.crypto.address(
                            {
                                publicKey: matcherPublicKeyBytes
                            },
                            ds.config.get('code'));

                        if (Object.prototype.hasOwnProperty.call(data.orderFee, 'dynamic')) {
                            return Promise.all([
                                this._scriptInfo(matcherAddress),
                                ...Object.keys(data.orderFee.dynamic.rates).map(id => ds.api.assets.get(id))
                            ]).then(([matcherInfo, ...feeAssets]) => {
                                return ({
                                    basedCustomFee: this.calculateCustomFeeMap({
                                        pair,
                                        matcherInfo,
                                        feeAssets,
                                        baseFee: data.orderFee.dynamic.baseFee
                                    }),
                                    feeMode: 'dynamic'
                                });
                            });
                        } else if (Object.prototype.hasOwnProperty.call(data.orderFee, 'fixed')) {
                            const feeValue = data.orderFee.fixed['min-fee'];
                            const feeAsset = data.orderFee.fixed.asset;
                            return ({
                                fee: new Money(feeValue, feeAsset),
                                feeMode: 'fixed'
                            });
                        } else {
                            return this.getCreateOrderFee(
                                {
                                    amount: new Money(0, pair.amountAsset),
                                    price: new Money(0, pair.priceAsset),
                                    matcherPublicKey
                                }).then(fee => {
                                return ({
                                    feeMode: 'waves',
                                    fee: fee
                                });
                            });
                        }

                        // const feeValue = '30000';
                        // return ds.api.assets.get('8jfD2JBLe23XtCCSQoTx5eAW5QCU6Mbxi3r78aNQLcNf')
                        //     .then(asset => {
                        //         return ({
                        //             // ...data,
                        //             fee: new Money(feeValue, asset),
                        //             feeMode: 'fixed'
                        //         });
                        //     });
                    });
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
             * @private
             */
            _updateCurrentMatcherAddress() {
                const networkMatcher = user.getSetting('network.matcher');

                ds.fetch(networkMatcher).then(matcherPublicKey => {
                    if (matcherPublicKey) {
                        const matcherPublicKeyBytes = libs.crypto.base58Decode(matcherPublicKey);
                        const matcherAddress = libs.crypto.address(
                            {
                                publicKey: matcherPublicKeyBytes
                            },
                            ds.config.get('code'));

                        this.currentMatcherAddress = matcherAddress;
                    }
                });
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

/**
 * @typedef {object} Matcher#IFeeMap
 * @property {number}
 */

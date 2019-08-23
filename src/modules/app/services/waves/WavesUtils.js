(function () {
    'use strict';

    /**
     * @param {Assets} assets
     * @param {app.utils} utils
     * @param {app.utils.decorators} decorators
     * @param {Transactions} transactions
     * @param {Matcher} matcher
     * @return {WavesUtils}
     */
    const factory = function (assets, utils, decorators, transactions, matcher) {

        const ds = require('data-service');
        const entities = require('@waves/data-entities');
        const { BigNumber } = require('@waves/bignumber');
        const {
            flatten, pipe, map,
            where, prop, gte, allPass,
            lte, filter, length, equals,
            __
        } = require('ramda');

        class WavesUtils {

            @decorators.cachable(5)
            searchAsset(userInput) {
                return ds.fetch(`${WavesApp.network.api}/assets/search/${userInput}`);
            }

            /**
             * Get rate (now or from date)
             * @param {string|Asset} assetFrom
             * @param {string|Asset} assetTo
             * @param {Date|number|Moment} [date] timestamp or Date
             * @return {Promise<BigNumber>}
             */
            @decorators.cachable(350)
            getRate(assetFrom, assetTo, date) {
                const WavesId = WavesApp.defaultAssets.WAVES;
                const from = WavesUtils.toId(assetFrom);
                const to = WavesUtils.toId(assetTo);

                if (from === to) {
                    return Promise.resolve(new BigNumber(1));
                }

                if (date) {
                    // TODO Add rate by date API. Author Tsigel at 22/11/2017 15:04
                } else if (from === WavesId || to === WavesId) {
                    return this._getRate(from, to);
                } else {
                    return utils.whenAll([
                        this._getRate(from, WavesId),
                        this._getRate(to, WavesId)
                    ])
                        .then(([rateFrom, rateTo]) => {
                            return rateTo.eq(0) ? rateTo : rateFrom.div(rateTo);
                        });
                }
            }

            @decorators.cachable(350)
            /**
             * @param {Asset[]} assetList
             * @param {string} baseAssetId
             * @return {Promise<IRateList>}
             */
            getRateList(assetList, baseAssetId, date) {
                const requestParamsStr = this._getRateListRequestStr(assetList, baseAssetId);
                const api = WavesApp.network.api;
                const version = WavesApp.network.apiVersion;
                const timestamp = date ? `timestamp=${date}&` : '';
                return ds.fetch(
                    // eslint-disable-next-line max-len
                    `${api}/${version}/matcher/${matcher.currentMatcherAddress}/rates?${timestamp}pairs=${requestParamsStr}`
                );
            }

            // @decorators.cachable(350)
            // getRateListPost(assetList, baseAssetId) {
            //     const requestParamsStr = this._getRateListRequestStr(assetList, baseAssetId);
            //     const api = WavesApp.network.api;
            //     const version = WavesApp.network.apiVersion;
            //     // eslint-disable-next-line max-len
            // eslint-disable-next-line max-len
            //     return ds.fetch(`${api}/${version}/matcher/${matcher.currentMatcherAddress}/rates?pairs=${requestParamsStr}`, {
            //         method: 'POST',
            //         body: JSON.stringify({
            //             pairs: requestParamsStr
            //         })
            //     });
            // }

            /**
             * Get api for current balance from another balance
             * @param {string|Asset} assetFrom
             * @param {string|Asset} assetTo
             * @return {Promise<WavesUtils.rateApi>}
             */
            getRateApi(assetFrom, assetTo) {
                return utils.whenAll([
                    assets.getAsset(WavesUtils.toId(assetFrom)),
                    assets.getAsset(WavesUtils.toId(assetTo)),
                    this.getRate(assetFrom, assetTo)
                ])
                    .then(([from, to, rate]) => {
                        return this._generateRateApi(from, to, rate);
                    });
            }

            /**
             * @param {string|Asset} assetFrom
             * @param {string|Asset} assetTo
             * @param {Date|number|Moment} from
             * @param {Date|number|Moment} [to]
             * @return {Promise<{rate: BigNumber, timestamp: Date}[]>}
             */
            @decorators.cachable(60)
            getRateHistory(assetFrom, assetTo, from, to) {
                const idFrom = WavesUtils.toId(assetFrom);
                const idTo = WavesUtils.toId(assetTo);
                const wavesId = WavesApp.defaultAssets.WAVES;
                to = to || Date.now();

                if (idFrom === idTo) {
                    return Promise.resolve([]);
                } else if (idFrom === wavesId || idTo === wavesId) {
                    return this._getRateHistory(idFrom, idTo, utils.moment(from), utils.moment(to));
                } else {
                    return Promise.all([
                        this._getRateHistory(idFrom, wavesId, utils.moment(from), utils.moment(to)),
                        this._getRateHistory(idTo, wavesId, utils.moment(from), utils.moment(to))
                    ])
                        .then(([from, to]) => {
                            const toHash = function (list) {
                                return list.reduce((result, item) => {
                                    result[item.timestamp.valueOf()] = item;
                                    return result;
                                }, Object.create(null));
                            };

                            const hash = toHash(to);

                            return from.reduce((result, item) => {
                                if (hash[item.timestamp.valueOf()]) {
                                    item.rate = item.rate.div(hash[item.timestamp.valueOf()].rate);
                                    result.push(item);
                                }
                                return result;
                            }, []);
                        });
                }
            }

            /**
             * @param {string|Asset} assetFrom
             * @param {string|Asset} assetTo
             * @return {Promise<BigNumber | Number>}
             */
            @decorators.cachable(60)
            getChange(assetFrom, assetTo) {
                const idFrom = WavesUtils.toId(assetFrom);
                const idTo = WavesUtils.toId(assetTo);

                if (idFrom === idTo) {
                    return Promise.resolve(new BigNumber(0));
                }

                return this._getChange(idFrom, idTo);
            }

            /**
             * @param pair
             * @returns {Promise<string>}
             */
            getVolume(pair) {
                return this._getVolume(pair, matcher.currentMatcherAddress);
            }

            /**
             * @param pair
             * @param {string} currentMatcherAddress
             * @returns {Promise<string>}
             */
            @decorators.cachable(60)
            _getVolume(pair, currentMatcherAddress) {
                return ds.api.pairs.info(currentMatcherAddress, [pair])
                    .then((data) => {
                        const [pair = {}] = data.filter(Boolean);
                        return pair && String(pair.volume) || '0';
                    });
            }

            /**
             * @param {string} from
             * @param {string} to
             * @return {Promise<Number>}
             * @private
             */
            _getChange(from, to) {
                const getChange = (open, close) => {
                    if (open.eq(0)) {
                        return new BigNumber(0);
                    } else {
                        return close.sub(open).div(open).mul(100).roundTo(2);
                    }
                };

                return ds.api.pairs.get(from, to)
                    .then(pair => ds.api.pairs.info(matcher.currentMatcherAddress, [pair])
                        .then(([data]) => {

                            if (!data || data.status === 'error') {
                                return 0;
                            }

                            const open = data.firstPrice || new entities.Money(0, pair.priceAsset);
                            const close = data.lastPrice || new entities.Money(0, pair.priceAsset);
                            const change24 = Number(getChange(open.getTokens(), close.getTokens()).toFixed());

                            if (pair.amountAsset.id === from) {
                                return change24;
                            } else {
                                return -change24;
                            }
                        }))
                    .catch(() => 0);
            }

            /**
             * @param {string} fromId
             * @param {string} toId
             * @return {Promise<BigNumber>}
             * @private
             */
            _getRate(fromId, toId) {

                const calculateCurrentRate = function (trades) {
                    return (
                        trades
                            .reduce((result, item) => {
                                return result.add(new BigNumber(item.price.getTokens()));
                            }, new BigNumber(0))
                            .div(trades.length)
                    );
                };

                const currentRate = (trades) => {
                    return trades && trades.length ? calculateCurrentRate(trades) : new BigNumber(0);
                };

                return ds.api.pairs.get(fromId, toId)
                    .then((pair) => {
                        return transactions.getExchangeTxList({
                            limit: 5,
                            amountAsset: pair.amountAsset,
                            priceAsset: pair.priceAsset
                        })
                            .then(currentRate)
                            .then((rate) => {
                                if (fromId !== pair.priceAsset.id) {
                                    return rate;
                                } else {
                                    return rate.eq(0) ? rate : new BigNumber(1).div(rate);
                                }
                            })
                            .catch(() => new BigNumber(0));
                    });
            }

            /**
             * @param {string} fromId
             * @param {string} toId
             * @param {Moment} from
             * @param {Moment} to
             * @return {Promise<{rate: BigNumber, timestamp: Date}[]>}
             * @private
             */
            _getRateHistory(fromId, toId, from, to) {
                const formattedFrom = from.getDate().getTime();
                const formattedTo = to.getDate().getTime();

                return ds.api.pairs.get(fromId, toId)
                    .then(pair => {
                        const amountId = pair.amountAsset.id;
                        const priceId = pair.priceAsset.id;
                        const dataService = ds.config.getDataService();
                        const int = utils.getMaxInterval(formattedFrom, formattedTo);
                        const { options } = utils.getValidCandleOptions(formattedFrom, formattedTo, int);
                        /**
                         * @type {Array<Promise<Response<Candle>>>}
                         */
                        const promises = options
                            .map(option => dataService.getCandles(amountId, priceId, option));

                        return Promise.all(promises)
                            .then(pipe(map(prop('data')), flatten))
                            .then(map(item => ({
                                close: item.close,
                                timestamp: new Date(item.time).getTime()
                            })))
                            .then(filter(where({
                                close: close => close.gt(0),
                                timestamp: allPass([gte(__, formattedFrom), lte(__, formattedTo)])
                            })))
                            .then(list => {
                                if (equals(length(list), 0)) {
                                    return Promise.reject(new Error(`Nor found by pair ${pair}`));
                                }
                                return list;
                            })
                            .then(map(({ timestamp, close }) => ({
                                timestamp: new Date(timestamp),
                                rate: fromId !== pair.priceAsset.id ? close : new BigNumber(1).div(close)
                            })));
                    });
            }

            /**
             * @param {Asset} from
             * @param {Asset} to
             * @param {BigNumber} rate
             * @return {WavesUtils.rateApi}
             * @private
             */
            _generateRateApi(from, to, rate) {
                return {
                    /**
                     * @name WavesUtils.rateApi#exchange
                     * @param {BigNumber} balance
                     * @return {BigNumber}
                     */
                    exchange(balance) {
                        return balance.mul(rate.toFixed(8))
                            .roundTo(to.precision);
                    },

                    /**
                     * @name WavesUtils.rateApi#exchangeReverse
                     * @param {BigNumber} balance
                     * @return {BigNumber}
                     */
                    exchangeReverse(balance) {
                        return (rate ? balance.div(rate) : new BigNumber(0)).roundTo(from.precision);
                    },

                    /**
                     * @name WavesUtils.rateApi#rate
                     */
                    rate
                };
            }

            /**
             * @param {Asset[]} assetList
             * @param {string} baseAssetId
             * @return {string}
             * @private
             */
            _getRateListRequestStr(assetList, baseAssetId) {
                const params = assetList.reduce((acc, asset, i) => {
                    const id = WavesUtils.toId(asset);
                    if (i) {
                        acc += ',';
                    }
                    acc += `${id}/${baseAssetId}`;
                    return acc;
                }, '');
                return params;
            }

            /**
             * @param {string|Asset} asset
             * @return {string}
             */
            static toId(asset) {
                return typeof asset === 'string' ? asset : asset.id;
            }

        }

        return new WavesUtils();
    };

    factory.$inject = ['assets', 'utils', 'decorators', 'transactions', 'matcher'];

    angular.module('app')
        .factory('wavesUtils', factory);
})();

/**
 * @name WavesUtils.rateApi
 */

/**
 * @typedef {object} IRateList
 * @property {string} __type
 * @property {IRateListData[]} data
 */

/**
 * @typedef {object} IRateListData
 * @property {string} __type
 * @property {IRateData} data
 */

/**
 * @typedef {object} IRateData
 * @property {string} __type
 * @property {string} amountAsset
 * @property {string} priceAsset
 * @property {number} current
 */

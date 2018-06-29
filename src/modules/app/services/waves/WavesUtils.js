(function () {
    'use strict';

    /**
     * @param {Assets} assets
     * @param {app.utils} utils
     * @param {app.utils.decorators} decorators
     * @return {WavesUtils}
     */
    const factory = function (assets, utils, decorators) {

        const ds = require('data-service');
        const entities = require('@waves/data-entities');

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
            @decorators.cachable(60)
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

            /**
             * Get api for current balance from another balance
             * @param {string|Asset} assetFrom
             * @param {string|Asset} assetTo
             * @param {Date|number} [date] timestamp or Date
             * @return {Promise<WavesUtils.rateApi>}
             */
            getRateApi(assetFrom, assetTo, date) {
                return utils.whenAll([
                    assets.getAsset(WavesUtils.toId(assetFrom)),
                    assets.getAsset(WavesUtils.toId(assetTo)),
                    this.getRate(assetFrom, assetTo, date)
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
             * @return {Promise<{rate: number, timestamp: Date}[]>}
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
                                    item.rate /= hash[item.timestamp.valueOf()].rate;
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
             * @return {Promise<number>}
             */
            @decorators.cachable(60)
            getChange(assetFrom, assetTo) {
                const idFrom = WavesUtils.toId(assetFrom);
                const idTo = WavesUtils.toId(assetTo);

                if (idFrom === idTo) {
                    return Promise.resolve(0);
                }

                return this._getChange(idFrom, idTo);
            }

            /**
             * @param pair
             * @returns {Promise<string>}
             */
            @decorators.cachable(60)
            getVolume(pair) {
                return ds.api.pairs.info(pair)
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
                        return close.minus(open).div(open).times(100).dp(2);
                    }
                };

                return ds.api.pairs.get(from, to)
                    .then((pair) => {
                        return ds.api.pairs.info(pair)
                            .catch(() => null)
                            .then(([data]) => {

                                if (!data || data.status === 'error') {
                                    return 0;
                                }

                                const open = data.firstPrice || new entities.Money(0, pair.priceAsset);
                                const close = data.lastPrice || new entities.Money(0, pair.priceAsset);
                                const change24 = getChange(open.getTokens(), close.getTokens()).toNumber();

                                if (pair.amountAsset.id === from) {
                                    return change24;
                                } else {
                                    return -change24;
                                }
                            });
                    });
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
                                return result.plus(new BigNumber(item.price.getTokens()));
                            }, new BigNumber(0))
                            .div(trades.length)
                    );
                };

                const currentRate = (trades) => {
                    return trades && trades.length ? calculateCurrentRate(trades) : new BigNumber(0);
                };

                return ds.api.pairs.get(fromId, toId)
                    .then((pair) => {
                        return ds.api.transactions.getExchangeTxList({
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
             * @return {Promise<{rate: number, timestamp: Date}[]>}
             * @private
             */
            _getRateHistory(fromId, toId, from, to) {
                const minuteTime = 1000 * 60;
                const interval = Math.round((to.getDate().getTime() - from.getDate().getTime()) / (200 * minuteTime));

                return ds.api.pairs.get(fromId, toId)
                    .then((pair) => {
                        const amountId = pair.amountAsset.id;
                        const priceId = pair.priceAsset.id;
                        const path = `${WavesApp.network.api}/candles/${amountId}/${priceId}`;

                        return ds.fetch(`${path}?timeStart=${from}&timeEnd=${to}&interval=${interval}m`)
                            .then((data) => {
                                const list = data.candles;

                                if (!list || !list.length) {
                                    return Promise.reject(list);
                                }

                                return list.reduce((result, item) => {
                                    const close = Number(item.close);
                                    const rate = fromId !== pair.priceAsset.id ? close : 1 / close;

                                    if (close !== 0) {
                                        result.push({
                                            timestamp: new Date(item.time),
                                            rate: rate
                                        });
                                    }

                                    return result.filter((item) => item.timestamp > from && item.timestamp < to)
                                        .sort(utils.comparators.process(({ timestamp }) => timestamp).asc);
                                }, []);
                            });
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
                        return balance.times(rate.toFixed(8))
                            .dp(to.precision);
                    },

                    /**
                     * @name WavesUtils.rateApi#exchangeReverse
                     * @param {BigNumber} balance
                     * @return {BigNumber}
                     */
                    exchangeReverse(balance) {
                        return (rate ? balance.div(rate) : new BigNumber(0)).dp(from.precision);
                    },

                    /**
                     * @name WavesUtils.rateApi#rate
                     */
                    rate
                };
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

    factory.$inject = ['assets', 'utils', 'decorators'];

    angular.module('app')
        .factory('wavesUtils', factory);
})();

/**
 * @name WavesUtils.rateApi
 */

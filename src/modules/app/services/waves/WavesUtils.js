(function () {
    'use strict';

    /**
     * @param {Assets} assets
     * @param {app.utils} utils
     * @param {app.utils.decorators} decorators
     * @return {WavesUtils}
     */
    const factory = function (assets, utils, decorators) {

        class WavesUtils {

            @decorators.cachable(5)
            searchAsset(userInput) {
                return fetch(`${WavesApp.network.api}/assets/search/${userInput}`)
                    .then(utils.onFetch);
            }

            /**
             * Get rate (now or from date)
             * @param {string|IAsset} assetFrom
             * @param {string|IAsset} assetTo
             * @param {Date|number|Moment} [date] timestamp or Date
             * @return {Promise<BigNumber>}
             */
            @decorators.cachable(60)
            getRate(assetFrom, assetTo, date) {
                const WavesId = WavesApp.defaultAssets.WAVES;
                const from = WavesUtils.toId(assetFrom);
                const to = WavesUtils.toId(assetTo);

                if (from === to) {
                    return utils.when(new BigNumber(1));
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
             * @param {string|IAsset} assetFrom
             * @param {string|IAsset} assetTo
             * @param {Date|number} [date] timestamp or Date
             * @return {Promise<WavesUtils.rateApi>}
             */
            getRateApi(assetFrom, assetTo, date) {
                return utils.whenAll([
                    assets.info(WavesUtils.toId(assetFrom)),
                    assets.info(WavesUtils.toId(assetTo)),
                    this.getRate(assetFrom, assetTo, date)
                ])
                    .then(([from, to, rate]) => {
                        return this._generateRateApi(from, to, rate);
                    });
            }

            /**
             * @param {string|IAsset} assetFrom
             * @param {string|IAsset} assetTo
             * @param {Date|number|Moment} from
             * @param {Date|number|Moment} [to]
             * @return {Promise<{rate: number, timestamp: Date}[]>}
             */
            @decorators.cachable(10)
            getRateHistory(assetFrom, assetTo, from, to) {
                const idFrom = WavesUtils.toId(assetFrom);
                const idTo = WavesUtils.toId(assetTo);
                const wavesId = WavesApp.defaultAssets.WAVES;
                to = to || Date.now();

                if (idFrom === idTo) {
                    return utils.when([]);
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
                                    item.rate = item.rate / hash[item.timestamp.valueOf()].rate;
                                    result.push(item);
                                }
                                return result;
                            }, []);
                        });
                }
            }

            /**
             * @param {IAsset|string} assetFrom
             * @param {IAsset|string} assetTo
             * @return {Promise<number>}
             */
            @decorators.cachable(60)
            getChange(assetFrom, assetTo) {
                const idFrom = WavesUtils.toId(assetFrom);
                const idTo = WavesUtils.toId(assetTo);
                const wavesId = WavesApp.defaultAssets.WAVES;
                if (idFrom === idTo) {
                    return 1;
                }

                if (idFrom !== wavesId && idTo !== wavesId) {
                    return Promise.all([
                        this._getChange(idFrom, wavesId),
                        this._getChange(idTo, wavesId)
                    ])
                        .then(([from, to]) => {
                            return to === 0 ? 0 : from / to;
                        });
                } else {
                    return this._getChange(idFrom, idTo);
                }
            }

            /**
             * @param {Moment} from
             * @private
             */
            _getChangeByInterval(from) {

                const MINUTE_TIME = 1000 * 60;
                const INTERVALS = [5, 30, 240, 1440];
                const MAX_COUNTS = 100;

                const intervalMinutes = (Date.now() - from.getDate()) / MINUTE_TIME;

                let interval, i = 0;
                do {
                    if (intervalMinutes / INTERVALS[i] < MAX_COUNTS) {
                        interval = INTERVALS[i];
                    } else {
                        i++;
                    }
                } while (!interval && INTERVALS[i]);

                if (!interval) {
                    interval = INTERVALS[INTERVALS.length - 1];
                }

                const count = Math.min(Math.floor(intervalMinutes / interval), MAX_COUNTS);

                return `${interval}/${count}`;
            }

            /**
             * @param {string} from
             * @param {string} to
             * @return {Promise<Number>}
             * @private
             */
            _getChange(from, to) {
                return Waves.AssetPair.get(from, to)
                    .then((pair) => {
                        return fetch(`${WavesApp.network.datafeed}/api/candles/${pair.toString()}/1440/1`)
                            .then(utils.onFetch)
                            .then((data) => {
                                if (!data || !data.length) {
                                    return 0;
                                }
                                const open = Number(data[0].open);
                                const close = Number(data[0].close);
                                const percent = open ? (close - open) * 100 / open : 0;

                                if (pair.amountAsset.id === from) {
                                    return percent;
                                } else {
                                    return -percent;
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

                const currentRate = (trades) => {
                    return trades && trades.length ? trades.reduce((result, item) => {
                        return result.add(new BigNumber(item.price));
                    }, new BigNumber(0))
                        .div(trades.length) : new BigNumber(0);
                };

                return Waves.AssetPair.get(fromId, toId)
                    .then((pair) => {
                        return fetch(`${WavesApp.network.datafeed}/api/trades/${pair.toString()}/5`)
                            .then(utils.onFetch)
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
                const interval = this._getChangeByInterval(from);
                return Waves.AssetPair.get(fromId, toId)
                    .then((pair) => {
                        return fetch(`${WavesApp.network.datafeed}/api/candles/${pair.toString()}/${interval}`)
                            .then(utils.onFetch)
                            .then((list) => {

                                if (!list || !list.length) {
                                    return Promise.reject(list);
                                }

                                return list.reduce((result, item) => {
                                    const close = Number(item.close);
                                    let rate = fromId !== pair.priceAsset.id ? close : 1 / close;

                                    if (close !== 0) {
                                        result.push({
                                            timestamp: new Date(item.timestamp),
                                            rate: rate
                                        });
                                    }

                                    return result.filter((item) => item.timestamp > from && item.timestamp < to);
                                }, []);
                            });
                    });
            }

            /**
             * @param {IAsset} from
             * @param {IAsset} to
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
                            .round(to.precision);
                    },

                    /**
                     * @name WavesUtils.rateApi#exchangeReverse
                     * @param {BigNumber} balance
                     * @return {BigNumber}
                     */
                    exchangeReverse(balance) {
                        return (rate ? balance.div(rate) : new BigNumber(0)).round(from.precision);
                    },

                    /**
                     * @name WavesUtils.rateApi#rate
                     */
                    rate
                };
            }

            /**
             * @param {string|IAsset} asset
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

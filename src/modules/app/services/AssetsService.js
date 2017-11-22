(function () {
    'use strict';

    /**
     * @param {app.utils.apiWorker} apiWorker
     * @param {app.utils.decorators} decorators
     * @param {User} user
     * @param {app.utils} utils
     * @param {EventManager} eventManager
     * @return {Waves}
     */
    const factory = function (apiWorker, decorators, user, utils, eventManager) {



        class Waves {


            @decorators.cachable(2)
            getOrders(assetId1, assetId2) {
                return apiWorker.process((Waves, { assetId1, assetId2 }) => {
                    return Waves.AssetPair.get(assetId1, assetId2).then((pair) => {
                        return Waves.API.Matcher.v1.getOrderbook(pair.amountAsset.id, pair.priceAsset.id)
                            .then((orderBook) => {

                                const mapOrder = (item) => {
                                    return Promise.all([
                                        Waves.Money.fromCoins(String(item.amount), pair.amountAsset),
                                        Waves.OrderPrice.fromMatcherCoins(String(item.price), pair)
                                            .then((orderPrice) => {
                                                return Waves.Money.fromTokens(orderPrice.getTokens(), pair.priceAsset);
                                            })
                                    ]).then((money) => {
                                        return { amount: money[0], price: money[1] };
                                    });
                                };

                                return Promise.all([
                                    Promise.all((orderBook.bids || []).map(mapOrder)),
                                    Promise.all((orderBook.asks || []).map(mapOrder))
                                ]).then((orders) => {
                                    return { bids: orders[0], asks: orders[1] };
                                });
                            });
                    });
                }, { assetId1, assetId2 });
            }

            @decorators.cachable(60)
            getChange(idFrom, idTo) {
                const marketUrl = 'https://marketdata.wavesplatform.com/api/candles';
                idTo = idTo || user.getSettingByUser(user, 'baseAssetId');

                const params = {
                    onFetch: utils.onFetch,
                    wavesId: WavesApp.defaultAssets.WAVES,
                    idFrom,
                    idTo,
                    marketUrl
                };

                return apiWorker.process((Waves, { onFetch, wavesId, idFrom, idTo, marketUrl }) => {

                    if (idFrom === idTo) {
                        return 1;
                    }

                    const getChange = function (from, to) {
                        return Waves.AssetPair.get(from, to)
                            .then((pair) => {
                                return fetch(`${marketUrl}/${pair.toString()}/1440/1`)
                                    .then(onFetch)
                                    .then((data) => {
                                        if (!data || !data.length) {
                                            return 0;
                                        }
                                        const open = Number(data[0].open);
                                        const close = Number(data[0].close);
                                        if (open > close) {
                                            return close === 0 ? 0 : -open / close;
                                        } else {
                                            return open === 0 ? 0 : close / open;
                                        }
                                    });
                            });
                    };

                    if (idFrom !== wavesId && idTo !== wavesId) {
                        return Promise.all([
                            getChange(idFrom, wavesId),
                            getChange(idTo, wavesId)
                        ])
                            .then((rateList) => {
                                return rateList[1] === 0 ? 0 : rateList[0] / rateList[1];
                            });
                    } else {
                        return getChange(idFrom, idTo);
                    }

                }, params);
            }

            /**
             * @param {string} idFrom
             * @param {string} idTo
             * @return {Promise<Waves.rateApi>}
             */
            @decorators.cachable(60)
            getRate(idFrom, idTo) {
                const marketUrl = 'https://marketdata.wavesplatform.com/api/trades';

                const params = {
                    onFetch: utils.onFetch,
                    wavesId: WavesApp.defaultAssets.WAVES,
                    idFrom,
                    idTo,
                    marketUrl
                };

                return utils.whenAll([
                    apiWorker.process((Waves, { onFetch, wavesId, idFrom, idTo, marketUrl }) => {

                        if (idFrom === idTo) {
                            return 1;
                        }

                        const currentRate = (trades) => {
                            return trades && trades.length ? trades.reduce((result, item) => {
                                return result.add(new WavesAPI.BigNumber(item.price));
                            }, new WavesAPI.BigNumber(0))
                                .div(trades.length) : new WavesAPI.BigNumber(0);
                        };

                        const getRate = function (from, to) {
                            return Waves.AssetPair.get(from, to)
                                .then((pair) => {
                                    return fetch(`${marketUrl}/${pair.toString()}/5`)
                                        .then(onFetch)
                                        .then(currentRate)
                                        .then((rate) => {
                                            if (from !== pair.priceAsset.id) {
                                                return rate;
                                            } else {
                                                return rate.eq(0) ? rate : new WavesAPI.BigNumber(1).div(rate);
                                            }
                                        }).catch((e) => {
                                            return new WavesAPI.BigNumber(0);
                                        });
                                });
                        };

                        if (idFrom !== wavesId && idTo !== wavesId) {
                            return Promise.all([
                                getRate(idFrom, wavesId),
                                getRate(idTo, wavesId)
                            ])
                                .then((rateList) => {
                                    return rateList[1].eq(0) ? rateList[1] : rateList[0].div(rateList[1]);
                                });
                        } else {
                            return getRate(idFrom, idTo);
                        }

                    }, params),
                    this.getAssetInfo(idFrom),
                    this.getAssetInfo(idTo)
                ])
                    .then(([rate, from, to]) => {
                        return this._generateRateApi(from, to, rate);
                    });
            }

            // TODO : getRateByDate as a wrapper for getRateHistory @xenohunter

            @decorators.cachable(20)
            getRateHistory(fromId, toId, time, count) {
                const params = {
                    onFetch: utils.onFetch,
                    time, count,
                    fromId, toId,
                    wavesId: WavesApp.defaultAssets.WAVES,
                    marketUrl: 'https://marketdata.wavesplatform.com/api/candles'
                };

                return apiWorker.process((Waves, { onFetch, time, count, fromId, toId, marketUrl, wavesId }) => {

                    const getRateHistory = function (from, to) {
                        return Waves.AssetPair.get(from, to)
                            .then((pair) => {
                                return fetch(`${marketUrl}/${pair.toString()}/${time}/${count}`)
                                    .then(onFetch)
                                    .then((list) => {
                                        if (!list || !list.length) {
                                            return Promise.reject(list);
                                        }

                                        return list.reduce((result, item) => {
                                            const close = Number(item.close);
                                            let rate = from !== pair.priceAsset.id ? close : 1 / close;

                                            if (close !== 0) {
                                                result.push({
                                                    timestamp: new Date(item.timestamp),
                                                    rate: rate
                                                });
                                            }

                                            return result;
                                        }, []);
                                    });
                            });
                    };

                    if (fromId !== wavesId && toId !== wavesId) {
                        return Promise.all([
                            getRateHistory(fromId, wavesId),
                            getRateHistory(toId, wavesId)
                        ])
                            .then((rateList) => {
                                const from = rateList[0];
                                const to = rateList[1];

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
                    } else {
                        return getRateHistory(fromId, toId);
                    }

                }, params);
            }

            /**
             * Resolves a promise given asset or Waves
             * @param asset
             * @return {Promise|IAssetInfo}
             */
            resolveAsset(asset) {
                if (asset) {
                    return Promise.resolve(asset);
                } else {
                    return this.getAssetInfo(WavesApp.defaultAssets.WAVES);
                }
            }



        }

        return utils.bind(new Waves());
    };

    factory.$inject = ['decorators', 'user', 'utils', 'eventManager'];

    angular.module('app')
        .factory('assetsService', factory);
})();

/**
 * @typedef {Object} IBalance
 * @property {string} id
 * @property {number} precision
 * @property {number} balance
 */

/**
 * @typedef {Object} IAssetInfo
 * @property {string} id
 * @property {string} name
 * @property {string} [description]
 * @property {number} precision
 * @property {boolean} reissuable
 * @property {Money} quantity
 * @property {number} timestamp
 * @property {number} height
 * @property {string} ticker
 * @property {string} sign
 */

/**
 * @typedef {Object} IAssetWithBalance
 * @property {string} id
 * @property {string} name
 * @property {string} [description]
 * @property {number} precision
 * @property {Money} balance
 * @property {boolean} reissuable
 * @property {Money} quantity
 * @property {number} timestamp
 * @property {number} height
 * @property {string} ticker
 * @property {string} sign
 */

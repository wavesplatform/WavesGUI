/* eslint-disable no-console */
(function () {
    'use strict';

    const { config } = require('data-service');
    const { flatten, pipe, prop, map } = require('ramda');
    const POLL_DELAY = 400;

    /**
     * @param {app.utils} utils
     * @param {TimeLine} timeLine
     * @param {SymbolInfoService} symbolInfoService
     * @param {Waves} waves
     * @return {CandlesService}
     */
    const factory = function (utils, timeLine, symbolInfoService, waves) {

        class CandlesService {

            constructor() {
                this._lastTime = 0;
                this._subscriber = null;
            }

            static _getAndHandleCandles(symbolInfo, from, to, resolution, handleCandles, handleError = angular.noop) {
                CandlesService
                    ._getCandles(
                        symbolInfo,
                        from,
                        to,
                        resolution
                    )
                    .then(handleCandles)
                    .catch(handleError);
            }

            /**
             * @param {string} symbolInfo
             * @param {number} from
             * @param {number} to
             * @param {number} interval
             * @return {Promise<T | Array>}
             * @private
             */
            static _getCandles(symbolInfo, from, to, interval) {
                const amountId = symbolInfo._wavesData.amountAsset.id;
                const priceId = symbolInfo._wavesData.priceAsset.id;
                const { options } = utils.getValidCandleOptions(from, to, interval);
                const promises = options.map(option => config.getDataService().getCandles(amountId, priceId, option));

                const candles = Promise.all(promises)
                    .then(pipe(map(prop('data')), flatten))
                    .then(list => list.map(candle => ({
                        ...candle,
                        high: candle.high.toString(),
                        low: candle.low.toString(),
                        close: candle.close.toString(),
                        open: candle.open.toString(),
                        volume: candle.volume.toString(),
                        quoteVolume: candle.quoteVolume.toString(),
                        weightedAveragePrice: candle.weightedAveragePrice.toString(),
                        time: new Date(candle.time).getTime()
                    })));

                const lastTrade = ds.api.pairs.get(amountId, priceId)
                    .then(pair => waves.matcher.getLastPrice(pair)
                        .catch(() => null));

                return Promise.all([candles, lastTrade])
                    .then(([candles, lastTrade]) => {
                        if (candles.length === 1 && lastTrade) {
                            const lastCandle = candles[candles.length - 1];
                            lastCandle.close = Number(lastTrade.price.toTokens());
                        }
                        return candles;
                    }).catch(() => []);
            }

            static convertToMilliseconds(seconds) {
                return Number(seconds) ? seconds * 1000 : Date.now();
            }

            onReady(callback) {
                setTimeout(() => callback({
                    supported_resolutions: WavesApp.dex.resolutions,
                    supports_time: true,
                    supports_marks: false,
                    supports_timescale_marks: false
                }), 0);
            }

            resolveSymbol(symbolName, resolve, reject) {
                if (symbolName.match(/^DEX:/)) {
                    return;
                }

                symbolInfoService.get(symbolName)
                    .then(resolve)
                    .catch(reject); // TODO
            }

            getBars(symbolInfo, resolution, from, to, onHistoryCallback, onErrorCallback) {
                from = CandlesService.convertToMilliseconds(from);
                to = CandlesService.convertToMilliseconds(to);
                const handleCandles = (candles) => {
                    if (candles.length) {
                        this._updateLastTime(candles);
                        onHistoryCallback(candles);
                    } else {
                        onHistoryCallback([], {
                            noData: true
                        });
                    }
                };

                CandlesService._getAndHandleCandles(
                    symbolInfo,
                    from,
                    to,
                    resolution,
                    handleCandles,
                    onErrorCallback
                );
            }

            subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) {
                this._subscriber = subscriberUID;

                const to = Date.now();
                const from = this._lastTime;

                const handleCandles = (candles) => {
                    if (this._subscriber !== subscriberUID) {
                        return;
                    }

                    this.subscribeBars(
                        symbolInfo,
                        resolution,
                        onRealtimeCallback,
                        subscriberUID,
                        onResetCacheNeededCallback
                    );

                    if (candles.length) {
                        this._updateLastTime(candles);
                        candles.forEach(onRealtimeCallback);
                    }
                };

                timeLine.timeout(() => {
                    CandlesService._getAndHandleCandles(
                        symbolInfo,
                        from,
                        to,
                        resolution,
                        handleCandles
                    );
                }, POLL_DELAY);
            }

            unsubscribeBars(subscriberUID) {
                if (this._subscriber === subscriberUID) {
                    this._subscriber = null;
                }
            }

            _updateLastTime(candles) {
                const lastTime = candles[candles.length - 1].time;
                if (this._lastTime && this._lastTime >= lastTime) {
                    return false;
                }
                this._lastTime = lastTime;
            }

        }

        return new CandlesService();
    };

    factory.$inject = ['utils', 'timeLine', 'symbolInfoService', 'waves'];

    angular.module('app.dex').factory('candlesService', factory);
})();

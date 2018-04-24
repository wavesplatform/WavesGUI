/* eslint-disable no-console */
(function () {
    'use strict';

    const POLL_DELAY = 3000;

    /**
     * @param {app.utils} utils
     * @param {TimeLine} timeLine
     * @param {SymbolInfoService} symbolInfoService
     * @return {CandlesService}
     */
    const factory = function (utils, timeLine, symbolInfoService) {

        class CandlesService {

            constructor() {
                this._lastTime = 0;
                this._subscriber = null;
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
                    CandlesService.convertToMilliseconds(from),
                    CandlesService.convertToMilliseconds(to),
                    resolution,
                    handleCandles,
                    onErrorCallback
                );
            }

            subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) {
                this._subscriber = subscriberUID;

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
                        this._lastTime,
                        Date.now(),
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
                this._lastTime = candles[candles.length - 1].time;
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

            static _getCandles(symbolInfo, from, to = Date.now(), resolution) {
                const amountId = symbolInfo._wavesData.amountAsset.id;
                const priceId = symbolInfo._wavesData.priceAsset.id;
                const interval = CandlesService._normalizeInterval(resolution);

                const path = `${WavesApp.network.api}/candles/${amountId}/${priceId}`;
                return fetch(`${path}?timeStart=${from}&timeEnd=${to}&interval=${interval}`)
                    .then((res) => res.candles);
            }

            static _normalizeInterval(interval) {
                const char = interval.charAt(interval.length - 1);
                return interval + (isNaN(+char) ? '' : 'm');
            }

            static convertToMilliseconds(seconds) {
                return seconds * 1000;
            }

        }

        return new CandlesService();
    };

    factory.$inject = ['utils', 'timeLine', 'symbolInfoService'];

    angular.module('app.dex').factory('candlesService', factory);
})();

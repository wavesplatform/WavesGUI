(function () {
    'use strict';

    const DEX_START = new Date('Apr 12 2017');
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

            searchSymbolsByName(userInput, exchange, symbolType, callback) {
                console.warn('This method should not be called');
                setTimeout(() => callback([]), 0);
                // symbolInfoService.search(userInput).then((list) => {
                //     callback(list.map(CandlesService._symbolInfoToSearchResult));
                // });
            }

            resolveSymbol(symbolName, resolve, reject) {
                if (symbolName.match(/^DEX:/)) return;
                symbolInfoService.get(symbolName)
                    .then(resolve)
                    .catch(reject); // TODO
            }

            getBars(symbolInfo, resolution, from, to, onHistoryCallback, onErrorCallback, firstDataRequest) {
                from = from * 1000;
                to = to * 1000;

                CandlesService._getCandles(symbolInfo, from, to, resolution)
                    .then((candles) => {
                        if (candles.length) {
                            this._lastTime = candles[candles.length - 1].time;
                            onHistoryCallback(candles);
                        } else {
                            onHistoryCallback([], {
                                noData: true,
                                nextTime: DEX_START.getTime() // TODO : get `nextTime` from server
                            });
                        }
                    })
                    .catch((e) => {
                        console.error(e);
                        onErrorCallback(e);
                    });
            }

            subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) {
                const args = arguments;
                this._subscriber = subscriberUID;

                timeLine.timeout(() => {
                    CandlesService._getCandles(symbolInfo, this._lastTime, Date.now(), resolution)
                        .then((candles) => {
                            if (this._subscriber === subscriberUID) {
                                this.subscribeBars.apply(this, args);
                                if (candles.length) {
                                    this._lastTime = candles[candles.length - 1].time;
                                    candles.forEach(onRealtimeCallback);
                                }
                            }
                        });
                }, POLL_DELAY);
            }

            unsubscribeBars(subscriberUID) {
                if (this._subscriber === subscriberUID) {
                    this._subscriber = null;
                }
            }

            // static _symbolInfoToSearchResult(symbolInfo) {
            //     return {
            //         symbol: symbolInfo.name, // This value is shown to user
            //         full_name: symbolInfo.ticker, // This value is passed to `this.resolveSymbol()`
            //         description: symbolInfo.ticker,
            //         ticker: symbolInfo.ticker
            //     };
            // }

            static _getCandles(symbolInfo, from, to = Date.now(), resolution) {
                const amountId = symbolInfo._wavesData.amountAsset.id;
                const priceId = symbolInfo._wavesData.priceAsset.id;
                const interval = CandlesService._normalizeInterval(resolution);

                const path = `${WavesApp.network.api}/candles/${amountId}/${priceId}`;
                return fetch(`${path}?timeStart=${from}&timeEnd=${to}&interval=${interval}`)
                    .then(utils.onFetch)
                    .then((res) => res.candles);
            }

            static _normalizeInterval(interval) {
                const char = interval.charAt(interval.length - 1);
                return interval + (isNaN(+char) ? '' : 'm');
            }

        }

        return new CandlesService();
    };

    factory.$inject = ['utils', 'timeLine', 'symbolInfoService'];

    angular.module('app.dex').factory('candlesService', factory);
})();

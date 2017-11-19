(function () {
    'use strict';

    const RESOLUTIONS = [5, 15, 30, 60, 240, 1440];

    const SYMBOLS = {
        WAVESBTC: {
            name: 'WAVESBTC',
            ticker: 'WAVESBTC',
            description: 'WAVESBTC',
            session: '24x7',
            exchange: 'DEX',
            listed_exchange: 'DEX',
            timezone: 'Europe/Madrid', // TODO?
            minmov: 1,
            pricescale: 100000000,

            // TODO : check all that
            has_intraday: true,
            intraday_multipliers: [5],
            supported_resolutions: RESOLUTIONS,
            has_seconds: false,
            seconds_multipliers: [5],
            has_daily: false,
            has_weekly_and_monthly: false,
            has_empty_bars: true,
            force_session_rebuild: false,
            has_no_volume: false,
            volume_precision: 8,
            data_status: 'pulsed'
        }
    };

    /**
     * @param dataFeed
     * @return {ChartDatafeedSupply}
     */
    const factory = function (dataFeed) {

        class ChartDatafeedSupply {

            onReady(callback) {
                callback({
                    exchanges: [],
                    symbol_types: [],
                    supported_resolutions: RESOLUTIONS,
                    support_marks: false,
                    supports_timescale_marks: false,
                    supports_time: true
                });
            }

            searchSymbolsByName(userInput, exchange, symbolType, callback) {
                callback([SYMBOLS.WAVESBTC]);
            }

            resolveSymbol(symbolName, resolve, reject) {
                if (symbolName === 'WAVESBTC') {
                    resolve(SYMBOLS.WAVESBTC);
                } else {
                    reject(false);
                }
            }

            getBars(symbolInfo, resolution, from, to, onHistoryCallback, onErrorCallback, firstDataRequest) {
                if (symbolInfo.ticker === 'WAVESBTC') {
                    dataFeed.candlesFrame('WAVES', 'BTC', resolution, from * 1000, to * 1000)
                        .then((d) => d.map(ChartDatafeedSupply._mapCandle).reverse())
                        .then(onHistoryCallback);
                } else {
                    throw new Error('No ticker yet');
                }
            }

            subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) {
                if (symbolInfo.ticker === 'WAVESBTC') {
                    dataFeed.candles('WAVES', 'BTC', resolution)
                        .then((d) => d.map(ChartDatafeedSupply._mapCandle).reverse())
                        .then((d) => d.forEach((c) => onRealtimeCallback(c)));
                } else {
                    throw new Error('No ticker yet');
                }
            }

            static _mapCandle(candle) {
                candle.time = candle.timestamp;
                return candle;
            }

        }

        return new ChartDatafeedSupply();
    };

    factory.$inject = ['dataFeed'];

    angular.module('app.dex').factory('chartDatafeedSupply', factory);
})();

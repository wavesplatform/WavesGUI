(function () {
    'use strict';

    var CANDLE_NUMBER = 100,
        CANDLE_FRAME = 30,
        POLLING_DELAY = 5000;

    function isCandleEmpty(c) {
        return +c.open === 0 && +c.high === 0 && +c.low === 0 && +c.close === 0 && +c.vwap === 0;
    }

    function adjustCandles(candles) {

        var i = candles.length;
        while (isCandleEmpty(candles[--i])) {}

        var fix = candles[i].open;
        while (++i < candles.length) {
            candles[i].open = candles[i].high = candles[i].low = candles[i].close = candles[i].vwap = fix;
        }

        return candles;

    }

    function ChartController($element, $interval, datafeedApiService, utilsService, chartsFactory) {
        var ctrl = this,
            intervalPromise;

        setTimeout(function () {
            // That instantiation is placed here because of the synchronous width resolving issue.
            ctrl.chart = chartsFactory.create('candlestick', $element);
            refreshCandles();
        }, 100);

        intervalPromise = $interval(refreshCandles, POLLING_DELAY);

        ctrl.$onChanges = function (changes) {
            if (ctrl.chart && changes.pair) {
                ctrl.chart.clear();
                refreshCandles();
            }
        };

        ctrl.$onDestroy = function () {
            $interval.cancel(intervalPromise);
        };

        function refreshCandles() {
            var pair = ctrl.pair;
            if (pair) {
                if (utilsService.isTestnet()) {
                    pair = utilsService.testnetSubstitutePair(pair);
                }

                datafeedApiService
                    .getLastCandles(pair, CANDLE_NUMBER, CANDLE_FRAME)
                    .then(function (response) {
                        response = adjustCandles(response);
                        ctrl.chart.draw(response);
                    });
            }
        }
    }

    ChartController.$inject = ['$element', '$interval', 'datafeedApiService', 'utilsService', 'chartsFactory'];

    angular
        .module('app.dex')
        .component('wavesDexChart', {
            controller: ChartController,
            bindings: {
                pair: '<'
            },
            templateUrl: 'dex/chart.component'
        });
})();

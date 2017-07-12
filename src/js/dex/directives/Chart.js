(function () {
    'use strict';

    const CANDLE_NUMBER = 100;
    const CANDLE_FRAME = 30;
    const POLLING_DELAY = 5000;

    function Chart($element, $interval, datafeedApiService, utilsService, chartsFactory) {
        const ctrl = this;

        setTimeout(() => {
            // That instantiation is placed here because of the synchronous width resolving issue.
            ctrl.chart = chartsFactory.create(`candlestick`, $element);
            refreshCandles();
        }, 100);

        const intervalPromise = $interval(refreshCandles, POLLING_DELAY);

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
            let pair = ctrl.pair;
            if (pair) {
                if (utilsService.isTestnet()) {
                    pair = utilsService.testnetSubstitutePair(pair);
                }

                datafeedApiService
                    .getLastCandles(pair, CANDLE_NUMBER, CANDLE_FRAME)
                    .then((response) => {
                        ctrl.chart.draw(response);
                    });
            }
        }
    }

    Chart.$inject = [`$element`, `$interval`, `datafeedApiService`, `utilsService`, `chartsFactory`];

    angular
        .module(`app.dex`)
        .component(`wavesDexChart`, {
            controller: Chart,
            bindings: {
                pair: `<`
            },
            templateUrl: `dex/chart.component`
        });
})();

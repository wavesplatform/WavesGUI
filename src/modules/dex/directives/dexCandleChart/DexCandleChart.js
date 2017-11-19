(function () {
    'use strict';

    const DISABLED_FEATURES = [
        'header_screenshot',
        'display_market_status'
    ];

    let counter = 0;

    /**
     *
     * @param {Base} Base
     * @param chartDatafeedSupply
     * @return {DexCandleChart}
     */
    const controller = function (Base, chartDatafeedSupply) {

        class DexCandleChart extends Base {

            constructor() {
                super();
                this.chart = null;
                this.elementId = 'tradingview' + counter++;

                this.syncSettings({
                    _amountAssetId: 'dex.amountAssetId',
                    _priceAssetId: 'dex.priceAssetId'
                }).then(() => {
                    this.observe(['_amountAssetId', '_priceAssetId'], () => console.log('Pair changed!'));
                });
            }

            $postLink() {
                setTimeout(() => {
                    this.chart = new TradingView.widget({
                        // debug: true,
                        symbol: 'WAVESBTC',
                        interval: 30,
                        container_id: this.elementId,
                        datafeed: chartDatafeedSupply,
                        library_path: 'vendors/charting_library/',
                        autosize: true,
                        disabled_features: DISABLED_FEATURES
                    });
                    console.log(this.chart);
                }, 0);
            }

        }

        return new DexCandleChart();
    };

    controller.$inject = ['Base', 'chartDatafeedSupply'];

    angular.module('app.dex').component('wDexCandleChart', {
        bindings: {},
        template: '<div class="candle-chart-wrapper" id="{{::$ctrl.elementId}}"></div>',
        transclude: false,
        controller
    });
})();

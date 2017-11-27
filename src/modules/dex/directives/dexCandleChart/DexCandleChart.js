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
     * @param candlesService
     * @return {DexCandleChart}
     */
    const controller = function (Base, candlesService) {

        class DexCandleChart extends Base {

            constructor() {
                super();
                this.chart = null;
                this.elementId = 'tradingview' + counter++;

                this.syncSettings({
                    _amountAssetId: 'dex.amountAssetId',
                    _priceAssetId: 'dex.priceAssetId'
                });

                this.observe(['_amountAssetId', '_priceAssetId'], () => console.log('Pair changed!'));
            }

            $postLink() {
                setTimeout(() => {
                    this.chart = new TradingView.widget({
                        // debug: true,
                        symbol: WavesApp.dex.defaultSymbol,
                        interval: WavesApp.dex.defaultResolution,
                        container_id: this.elementId,
                        datafeed: candlesService,
                        library_path: 'vendors/charting_library/',
                        autosize: true,
                        disabled_features: DISABLED_FEATURES
                    });
                }, 0);
            }

        }

        return new DexCandleChart();
    };

    controller.$inject = ['Base', 'candlesService'];

    angular.module('app.dex').component('wDexCandleChart', {
        bindings: {},
        template: '<div class="candle-chart-wrapper" id="{{::$ctrl.elementId}}"></div>',
        transclude: false,
        controller
    });
})();

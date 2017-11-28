(function () {
    'use strict';

    const DISABLED_FEATURES = [
        'header_screenshot',
        'header_symbol_search',
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
                this.chartReady = false;
                this.elementId = 'tradingview' + counter++;

                this.syncSettings({
                    _amountAssetId: 'dex.amountAssetId',
                    _priceAssetId: 'dex.priceAssetId'
                });

                this.observe(['_amountAssetId', '_priceAssetId'], () => {
                    if (this.chartReady) {
                        this.chart.symbolInterval(({ interval }) => {
                            this.chart.setSymbol(`${this._amountAssetId}/${this._priceAssetId}`, interval);
                        });
                    } else {
                        // TODO : wait until it's ready and switch to the active pair
                    }
                });
            }

            $postLink() {
                setTimeout(() => {
                    this.chart = new TradingView.widget({
                        // debug: true,
                        symbol: `${this._amountAssetId}/${this._priceAssetId}`,
                        interval: WavesApp.dex.defaultResolution,
                        container_id: this.elementId,
                        datafeed: candlesService,
                        library_path: 'node_modules/@waves/trading-view/',
                        autosize: true,
                        disabled_features: DISABLED_FEATURES
                    });

                    this.chart.onChartReady(() => {
                        this.chartReady = true;
                        // this.chart.subscribe('onSymbolChange', (data) => console.log(data));
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

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
                this.notLoaded = false;

                /**
                 * @type {{price: string, amount: string}}
                 * @private
                 */
                this._assetIdPair = null;

                this.observe('_assetIdPair', () => {

                    if (this.chartReady) {
                        this.chart.symbolInterval(({ interval }) => {
                            this.chart.setSymbol(`${this._assetIdPair.amount}/${this._assetIdPair.price}`, interval);
                        });
                    } else {
                        // TODO : wait until it's ready and switch to the active pair
                    }
                });

                this.syncSettings({
                    _assetIdPair: 'dex.assetIdPair'
                });
            }

            $postLink() {
                controller.load().then(() => {
                    this.chart = new TradingView.widget({
                        // debug: true,
                        symbol: `${this._assetIdPair.amount}/${this._assetIdPair.price}`,
                        interval: WavesApp.dex.defaultResolution,
                        container_id: this.elementId,
                        datafeed: candlesService,
                        library_path: 'trading-view/',
                        autosize: true,
                        disabled_features: DISABLED_FEATURES
                    });

                    this.chart.onChartReady(() => {
                        this.chartReady = true;
                        // this.chart.subscribe('onSymbolChange', (data) => console.log(data));
                    });
                }, () => {
                    console.warn('Error 403!');
                    this.notLoaded = true;
                });
            }

        }

        return new DexCandleChart();
    };

    controller.$inject = ['Base', 'candlesService'];

    controller.load = function () {
        const script = document.createElement('script');
        const root = WavesApp.isWeb() ? 'https://jslib.wavesnodes.com/' : '/trading-view/';
        script.src = `${root}charting_library.min.js`;
        const promise = new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
        controller.load = () => promise;
        return promise;
    };

    angular.module('app.dex').component('wDexCandleChart', {
        bindings: {},
        templateUrl: 'modules/dex/directives/dexCandleChart/dex-candle-chart.html',
        transclude: false,
        controller
    });
})();

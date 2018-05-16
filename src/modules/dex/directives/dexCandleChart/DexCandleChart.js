/* eslint-disable no-console */
(function () {
    'use strict';

    const DISABLED_FEATURES = [
        'header_screenshot',
        'header_symbol_search',
        'symbol_search_hot_key',
        'display_market_status'
        // 'border_around_the_chart', // TODO : decide whether to switch it off or not
        // 'control_bar',
        // 'timeframes_toolbar'
    ];

    // const OVERRIDES = {
    //     'mainSeriesProperties.candleStyle.upColor': '#5a81ea',
    //     'mainSeriesProperties.candleStyle.downColor': '#d1383c',
    //     'mainSeriesProperties.candleStyle.drawBorder': false
    // };
    //
    // const STUDIES_OVERRIDES = {
    //     'volume.volume.color.0': 'rgba(209,56,60,0.3)',
    //     'volume.volume.color.1': 'rgba(90,129,234,0.3)'
    // };

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
                this.elementId = `tradingview${counter++}`;
                this.notLoaded = false;
                this._assetIdPairWasChanged = false;

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
                        this._assetIdPairWasChanged = true;
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
                        toolbar_bg: '#fff',
                        symbol: `${this._assetIdPair.amount}/${this._assetIdPair.price}`,
                        interval: WavesApp.dex.defaultResolution,
                        container_id: this.elementId,
                        datafeed: candlesService,
                        library_path: 'trading-view/',
                        autosize: true,
                        disabled_features: DISABLED_FEATURES
                        // overrides: OVERRIDES,
                        // studies_overrides: STUDIES_OVERRIDES
                    });

                    this.chart.onChartReady(() => {
                        this.chartReady = true;
                        // this.chart.subscribe('onSymbolChange', (data) => console.log(data));
                        if (this._assetIdPairWasChanged) {
                            this.chart.symbolInterval(({ interval }) => {
                                this.chart.setSymbol(
                                    `${this._assetIdPair.amount}/${this._assetIdPair.price}`,
                                    interval
                                );
                            });
                        }
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
        script.src = '/trading-view/charting_library.min.js';
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

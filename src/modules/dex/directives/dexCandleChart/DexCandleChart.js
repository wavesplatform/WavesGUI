/* eslint-disable no-console */
(function () {
    'use strict';

    const CANDLE_UP_COLOR = '#5a81ea';
    const CANDLE_DOWN_COLOR = '#d1383c';

    const DISABLED_FEATURES = [
        'header_screenshot',
        'header_symbol_search',
        'symbol_search_hot_key',
        'display_market_status',
        'control_bar',
        'timeframes_toolbar'
    ];

    // TODO : added in version 1.12
    // const ENABLED_FEATURES = [
    //     'hide_left_toolbar_by_default'
    // ];

    const OVERRIDES = {
        'mainSeriesProperties.candleStyle.upColor': CANDLE_UP_COLOR,
        'mainSeriesProperties.candleStyle.downColor': CANDLE_DOWN_COLOR,
        'mainSeriesProperties.candleStyle.drawBorder': false,
        'mainSeriesProperties.hollowCandleStyle.upColor': CANDLE_UP_COLOR,
        'mainSeriesProperties.hollowCandleStyle.downColor': CANDLE_DOWN_COLOR,
        'mainSeriesProperties.hollowCandleStyle.drawBorder': false,
        'mainSeriesProperties.barStyle.upColor': CANDLE_UP_COLOR,
        'mainSeriesProperties.barStyle.downColor': CANDLE_DOWN_COLOR,
        'mainSeriesProperties.haStyle.upColor': CANDLE_UP_COLOR,
        'mainSeriesProperties.haStyle.downColor': CANDLE_DOWN_COLOR,
        'mainSeriesProperties.haStyle.drawBorder': false,
        'mainSeriesProperties.lineStyle.color': CANDLE_UP_COLOR,
        'mainSeriesProperties.areaStyle.color1': CANDLE_UP_COLOR,
        'mainSeriesProperties.areaStyle.color2': CANDLE_UP_COLOR,
        'mainSeriesProperties.areaStyle.linecolor': CANDLE_UP_COLOR,
        'scalesProperties.lineColor': '#edf0f4'
    };

    const STUDIES_OVERRIDES = {
        'volume.volume.color.0': 'rgba(209,56,60,0.3)',
        'volume.volume.color.1': 'rgba(90,129,234,0.3)'
    };

    let counter = 0;

    /**
     *
     * @param {Base} Base
     * @param candlesService
     * @param {$rootScope.Scope} $scope
     * @return {DexCandleChart}
     */
    const controller = function (Base, candlesService, $scope) {

        class DexCandleChart extends Base {

            constructor() {
                super();
                /**
                 * @type {string}
                 */
                this.elementId = `tradingview${counter++}`;
                /**
                 * @type {boolean}
                 */
                this.notLoaded = false;
                /**
                 * @type {TradingView}
                 * @private
                 */
                this._chart = null;
                /**
                 * @type {boolean}
                 * @private
                 */
                this._chartReady = false;
                /**
                 * @type {boolean}
                 * @private
                 */
                this._assetIdPairWasChanged = false;
                /**
                 * @type {{price: string, amount: string}}
                 * @private
                 */
                this._assetIdPair = null;

                this.observe('_assetIdPair', this._onChangeAssetPair);
                this.syncSettings({ _assetIdPair: 'dex.assetIdPair' });
            }

            $postLink() {
                controller.load()
                    .then(() => {
                        this._createTradingView();
                        this.listenEventEmitter(i18next, 'languageChanged', this._changeLangHandler.bind(this));
                    }, () => {
                        console.warn('Error 403!');
                        this.notLoaded = true;
                    })
                    .then(() => {
                        $scope.$apply();
                    });
            }

            $onDestroy() {
                super.$onDestroy();
                this._removeTradingView();
            }

            /**
             * @private
             */
            _onChangeAssetPair() {
                if (this._chartReady) {
                    this._setChartPair();
                } else {
                    this._assetIdPairWasChanged = true;
                }
            }

            /**
             * @return {*}
             * @private
             */
            _resetTradingView() {
                return this._removeTradingView()
                    ._createTradingView();
            }

            /**
             * @return {DexCandleChart}
             * @private
             */
            _removeTradingView() {
                try {
                    if (this._chart) {
                        this._chart.remove();
                    }
                } catch (e) {
                    // Can't remove _chart
                }
                this._chart = null;
                return this;
            }

            /**
             * @return {DexCandleChart}
             * @private
             */
            _createTradingView() {
                this._chart = new TradingView.widget({
                    // debug: true,
                    locale: DexCandleChart._remapLanguageCode(i18next.language),
                    toolbar_bg: '#fff',
                    symbol: `${this._assetIdPair.amount}/${this._assetIdPair.price}`,
                    interval: WavesApp.dex.defaultResolution,
                    container_id: this.elementId,
                    datafeed: candlesService,
                    library_path: 'trading-view/',
                    autosize: true,
                    disabled_features: DISABLED_FEATURES,
                    // enabled_features: ENABLED_FEATURES,
                    overrides: OVERRIDES,
                    studies_overrides: STUDIES_OVERRIDES,
                    custom_css_url: '/tradingview-style/style.css'
                });

                if (this._assetIdPairWasChanged) {
                    this._chart.onChartReady(() => {
                        this._setChartPair();
                        this._assetIdPairWasChanged = false;
                        this._chartReady = true;
                    });
                }

                return this;
            }

            /**
             * @private
             */
            _setChartPair() {
                this._chart.symbolInterval(({ interval }) => {
                    this._chart.setSymbol(`${this._assetIdPair.amount}/${this._assetIdPair.price}`, interval);
                });
            }

            /**
             * @private
             */
            _changeLangHandler() {
                return this._resetTradingView();
            }

            static _remapLanguageCode(code) {
                switch (code) {
                    case 'hi':
                        return 'en';
                    case 'nl':
                        return 'nl_NL';
                    case 'zh-Hans-CN':
                        return 'zh';
                    default:
                        return code;
                }
            }

        }

        return new DexCandleChart();
    };

    controller.$inject = ['Base', 'candlesService', '$scope'];

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

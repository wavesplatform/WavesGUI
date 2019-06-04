/* eslint-disable no-console */
(function () {
    'use strict';

    const DISABLED_FEATURES = [
        'header_screenshot',
        'header_symbol_search',
        'symbol_search_hot_key',
        'display_market_status',
        'control_bar',
        'timeframes_toolbar',
        'volume_force_overlay'
    ];

    // TODO : added in version 1.12
    // const ENABLED_FEATURES = [
    //     'hide_left_toolbar_by_default'
    // ];

    function getOverrides(candleUpColor, candleDownColor) {
        return {
            'mainSeriesProperties.candleStyle.upColor': candleUpColor,
            'mainSeriesProperties.candleStyle.downColor': candleDownColor,
            'mainSeriesProperties.candleStyle.drawBorder': false,
            'mainSeriesProperties.hollowCandleStyle.upColor': candleUpColor,
            'mainSeriesProperties.hollowCandleStyle.downColor': candleDownColor,
            'mainSeriesProperties.hollowCandleStyle.drawBorder': false,
            'mainSeriesProperties.barStyle.upColor': candleUpColor,
            'mainSeriesProperties.barStyle.downColor': candleDownColor,
            'mainSeriesProperties.haStyle.upColor': candleUpColor,
            'mainSeriesProperties.haStyle.downColor': candleDownColor,
            'mainSeriesProperties.haStyle.drawBorder': false,
            'mainSeriesProperties.lineStyle.color': candleUpColor,
            'mainSeriesProperties.areaStyle.color1': candleUpColor,
            'mainSeriesProperties.areaStyle.color2': candleUpColor,
            'mainSeriesProperties.areaStyle.linecolor': candleUpColor,
            'volumePaneSize': 'medium'
        };
    }

    function getStudiesOverrides({ volume0, volume1 }) {
        return {
            'volume.volume.color.0': volume0,
            'volume.volume.color.1': volume1
        };
    }

    let counter = 0;

    /**
     *
     * @param {Base} Base
     * @param candlesService
     * @param {$rootScope.Scope} $scope
     * @param {app.themes} themes
     * @return {DexCandleChart}
     */
    const controller = function (Base, candlesService, $scope, themes, user) {

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
                 * @type {boolean}
                 * @private
                 */
                this._changeTheme = true;
                /**
                 * @type {{price: string, amount: string}}
                 */
                this._assetIdPair = null;
                /**
                 * @type {boolean}
                 * @private
                 */
                this.loadingTradingView = true;
                /**
                 * @type {string}
                 * @private
                 */
                this.theme = user.getSetting('theme');
                /**
                 * @type {string}
                 * @private
                 */
                this.candle = user.getSetting('candle');

                this.observe('_assetIdPair', this._onChangeAssetPair);
                this.observe('theme', () => {
                    this._changeTheme = true;
                    this._resetTradingView();
                });
                this.observe('candle', this._refreshTradingView);
                this.syncSettings({ _assetIdPair: 'dex.assetIdPair' });
                this.syncSettings({ theme: 'theme' });
                this.syncSettings({ candle: 'candle' });
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
                try {
                    return this._removeTradingView()
                        ._createTradingView();
                } catch (e) {
                    // Trading view not loaded
                }
            }

            /**
             * @return {DexCandleChart}
             * @private
             */
            _removeTradingView() {
                candlesService.unsubscribeBars();
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
             * @private
             */
            _refreshTradingView() {
                if (!this._chart) {
                    return null;
                }
                const { up, down, volume0, volume1 } = themes.getCurrentCandleSColor(this.candle);
                const overrides = getOverrides(up, down);
                const studiesOverrides = getStudiesOverrides({ volume0, volume1 });
                this._chart.applyOverrides(overrides);
                this._chart.applyStudiesOverrides(studiesOverrides);
            }

            /**
             * @return {DexCandleChart}
             * @private
             */
            _createTradingView() {
                this.loadingTradingView = true;

                const { up, down, volume0, volume1 } = themes.getCurrentCandleSColor(this.candle);
                const themeConf = themes.getTradingViewConfig(this.theme);
                const overrides = { ...getOverrides(up, down), ...themeConf.OVERRIDES };
                const studies_overrides = {
                    ...getStudiesOverrides({ volume0, volume1 }),
                    ...themeConf.STUDIES_OVERRIDES
                };
                const toolbar_bg = themeConf.toolbarBg;
                const custom_css_url = themeConf.customCssUrl;

                this._chart = new TradingView.widget({
                    // debug: true,
                    locale: DexCandleChart._remapLanguageCode(i18next.language),
                    symbol: `${this._assetIdPair.amount}/${this._assetIdPair.price}`,
                    interval: user.getSetting('lastInterval'),
                    container_id: this.elementId,
                    datafeed: candlesService,
                    library_path: 'trading-view/',
                    autosize: true,
                    toolbar_bg,
                    disabled_features: DISABLED_FEATURES,
                    // enabled_features: ENABLED_FEATURES,
                    overrides,
                    studies_overrides,
                    custom_css_url,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                });

                this._chart.onChartReady(() => {
                    if (this._changeTheme) {
                        this._chart.applyOverrides(overrides);
                        this._chart.applyStudiesOverrides(studies_overrides);
                    }

                    this._changeTheme = false;
                    this.loadingTradingView = false;

                    if (this._assetIdPairWasChanged) {
                        this._setChartPair();
                        this._assetIdPairWasChanged = false;
                        this._chartReady = true;
                    }

                    this._chart.subscribe('onIntervalChange', (e) => {
                        user.setSetting('lastInterval', e);
                    });
                });
                this._chart.options.datafeed.onLoadError = () => {
                    this.notLoaded = true;
                };
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
                    case 'hi_IN':
                        return 'en';
                    case 'id':
                        return 'en';
                    case 'zh_CN':
                        return 'zh';
                    case 'pt_BR':
                        return 'pt';
                    default:
                        return code;
                }
            }

        }

        return new DexCandleChart();
    };

    controller.$inject = ['Base', 'candlesService', '$scope', 'themes', 'user'];

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

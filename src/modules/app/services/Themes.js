(function () {
    'use strict';

    const DEFAULT_THEME = 'default';
    const DEFAULT_CANDLE = 'blue';
    /**
     * @name app.themes
     */

    /**
     * @return {app.theme}
     */
    const factory = function () {

        class Themes {

            constructor() {
                this._events = {};
                this.cssRules = {};
                this.currentTheme = DEFAULT_THEME;
                this.themes = WavesApp.themesConf.themes;
                this.candleColors = {};
                this._initCssStyleEl();
                this.changeTheme();
                this._setDefaultCandle();
                this.links = [].slice.apply(document.querySelectorAll('[rel=stylesheet]'))
                    .filter(function (el) {
                        return el.getAttribute('theme');
                    });
            }

            getCurrentTheme() {
                return this.currentTheme;
            }

            getDefaultTheme() {
                return DEFAULT_THEME;
            }

            changeTheme(name) {
                name = name || DEFAULT_THEME;
                if (this.hasTheme(name) && name !== this.currentTheme) {
                    this.currentTheme = name;
                    this._changeTheme(name);
                }

                return this.currentTheme;
            }

            hasTheme(name) {
                return this.themes.includes(name);
            }

            getAllThemes() {
                return this.themes;
            }

            getSettings(theme) {
                return WavesApp.themesConf[theme || this.currentTheme || DEFAULT_THEME] || {};
            }

            getTradingViewConfig(theme) {
                return this.getSettings(theme).tradingView || {};
            }

            switchNext() {
                const index = this.themes.indexOf(this.currentTheme) + 1;
                const newTheme = this.themes[index % this.themes.length];
                this.changeTheme(newTheme);
                return this.currentTheme;
            }

            getCandlesColors(currentTheme) {
                return this.getTradingViewConfig(currentTheme).candles;
            }

            getCurrentCandleSColor(name) {
                if (name) {
                    const { upColor, downColor, volume0, volume1 } = this.getCandlesColors()[name];
                    return { up: upColor, down: downColor, volume0, volume1 };
                }

                let { up, down, volume0, volume1 } = this.candleColors;
                up = up || this.getCandlesColors()[DEFAULT_CANDLE].upColor;
                down = down || this.getCandlesColors()[DEFAULT_CANDLE].downColor;
                volume0 = volume0 || this.getCandlesColors()[DEFAULT_CANDLE].volume0;
                volume1 = volume1 || this.getCandlesColors()[DEFAULT_CANDLE].volume1;
                return { up, down, volume0, volume1 };
            }

            changeStyleRules(rules) {
                this.cssRules = { ...this.cssRules, ...rules };
                this._applyRules();
            }

            setCandleColors(up, down) {
                this.candleColors = { up, down };
                this.changeStyleRules({
                    '.candle-up-color-dynamic': { color: `${up}!important` },
                    '.candle-down-color-dynamic': { color: `${down}!important` },
                    '.candle-up-bg-color-dynamic': { 'background-color': `${up}!important` },
                    '.candle-down-bg-color-dynamic': { 'background-color': `${down}!important` }
                });
            }

            setCandleColorsByName(currentTheme, name) {
                const colors = this.getCandlesColors(currentTheme);
                const cfg = colors[name] || colors[DEFAULT_CANDLE];
                if (cfg) {
                    this.setCandleColors(cfg.upColor, cfg.downColor);
                }
            }

            _setDefaultCandle() {
                const { upColor, downColor } = this.getCandlesColors()[DEFAULT_CANDLE];
                this.setCandleColors(upColor, downColor);
            }

            _changeTheme(name) {
                this.links.forEach(style => {
                    if (style.getAttribute('theme') === name) {
                        style.disabled = false;
                        document.head.appendChild(style);
                    }
                });
            }

            _applyRules() {

                let cssText = '';

                const parseStyles = (styles = {}) => {
                    let stylesTxt = '';

                    for (const [style, value] of Object.entries(styles)) {
                        stylesTxt += `\n${style}: ${value};`;
                    }

                    return stylesTxt;
                };

                for (const [rule, css] of Object.entries(this.cssRules)) {
                    cssText += `${rule} {${parseStyles(css)}\n}\n`;
                }

                this.cssStyleEl.innerHTML = cssText;
            }

            _initCssStyleEl() {
                this.cssStyleEl = document.createElement('style');
                document.head.appendChild(this.cssStyleEl);
            }

        }

        return new Themes();
    };

    factory.$inject = [];

    angular.module('app').factory('themes', factory);
})();

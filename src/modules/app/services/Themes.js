(function () {
    'use strict';

    const DEFAULT_THEME = 'default';

    /**
     * @name app.themes
     */

    /**
     * @return {app.theme}
     */
    const factory = function () {

        class Themes {

            constructor() {
                this.currentTheme = DEFAULT_THEME;
                this.themes = WavesApp.themesConf.themes;
                this.changeTheme();
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

            getTradingViewConfig() {
                return WavesApp.themesConf.tradingView[this.currentTheme || DEFAULT_THEME] || {};
            }

            switchNext() {
                const index = this.themes.indexOf(this.currentTheme) + 1;
                const newTheme = this.themes[index % this.themes.length];
                this.changeTheme(newTheme);
                return this.currentTheme;
            }

            _changeTheme(name) {
                const styleSheets = [].slice.apply(document.querySelectorAll('[rel=stylesheet]'))
                    .filter(function (el) {
                        return el.getAttribute('theme');
                    });
                styleSheets.forEach(style => {
                    style.disabled = style.getAttribute('theme') !== name;
                });
            }

        }

        return new Themes();
    };

    factory.$inject = [];

    angular.module('app').factory('themes', factory);
})();

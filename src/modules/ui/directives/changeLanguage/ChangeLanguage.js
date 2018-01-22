(function () {
    'use strict';

    /**
     * @param Base
     * @param {$scope} $scope
     * @returns {ChangeLanguage}
     */
    const controller = function (Base) {

        class ChangeLanguage extends Base {

            constructor() {
                super();
                /**
                 * @type {function}
                 */
                this.onChange = null;
                /**
                 * @type {string[]}
                 */
                this.list = Object.keys(WavesApp.localize);
                /**
                 * @type {string}
                 */
                this.active = i18next.language;

                this.observe('active', this._onChangeLanguage);
            }

            /**
             * @private
             */
            _onChangeLanguage() {
                const active = this.active;
                if (active) {
                    i18next.changeLanguage(active);
                    this.onChange({ language: active });
                }
            }

        }

        return new ChangeLanguage();
    };

    controller.$inject = ['Base'];

    angular.module('app.ui').component('wChangeLanguage', {
        bindings: {
            onChange: '&'
        },
        templateUrl: 'modules/ui/directives/changeLanguage/changeLanguage.html',
        transclude: false,
        controller
    });
})();

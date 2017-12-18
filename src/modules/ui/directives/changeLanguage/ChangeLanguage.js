(function () {
    'use strict';

    /**
     * @param Base
     * @param {$scope} $scope
     * @returns {ChangeLanguage}
     */
    const controller = function (Base, $scope) {

        class ChangeLanguage extends Base {

            constructor() {
                super();
                this.list = WavesApp.langList.slice();
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
                }
            }

        }

        return new ChangeLanguage();
    };

    controller.$inject = ['Base', '$scope'];

    angular.module('app.ui').component('wChangeLanguage', {
        bindings: {},
        templateUrl: 'modules/ui/directives/changeLanguage/changeLanguage.html',
        transclude: false,
        controller
    });
})();

(function () {
    'use strict';

    const controller = function ($element) {

        class ToggleClassContainer {

            toggleClass(className) {
                $element.toggleClass(className);
            }

            addClass(className) {
                $element.addClass(className);
            }

        }

        return new ToggleClassContainer();
    };

    controller.$inject = ['$element'];

    const directive = function () {
        return {
            scope: false,
            restrict: 'A',
            controller
        };
    };

    angular.module('app.ui').directive('wToggleClassContainer', directive);
})();

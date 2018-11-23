(function () {
    'use strict';


    angular.module('app.ui').directive('wWebOnlyClass', () => ({
        restrict: 'A',
        scope: false,
        link: ($scope, $element, $attr) => {
            if (WavesApp.isWeb()) {
                $element.addClass($attr.wWebOnlyClass);
            }
        }
    }));
})();

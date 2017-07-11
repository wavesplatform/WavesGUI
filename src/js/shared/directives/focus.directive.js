(function () {
    'use strict';

    angular
        .module('app.shared')
        .directive('focusMe', ['$timeout', function WavesFocusDirective($timeout) {
            return {
                restrict: 'A',
                link: function (scope, element, attributes) {
                    scope.$watch(attributes.focusMe, function (newValue) {
                        $timeout(function () {
                            return newValue && element[0].focus();
                        });
                    }, true);
                }
            };
        }]);
})();

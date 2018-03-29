(function () {
    'use strict';

    const directive = function () {
        return {
            scope: false,
            require: '^^wToggleClassContainer',
            restrict: 'A',
            /**
             *
             * @param $scope
             * @param $element
             * @param $attrs
             * @param {ToggleClassContainer} $container
             */
            link($scope, $element, $attrs, $container) {
                $element.on('click', () => {
                    $container.addClass($element.attr('w-toggle-class') || 'active');
                });
            }
        };
    };

    angular.module('app.ui').directive('wAddClass', directive);
})();

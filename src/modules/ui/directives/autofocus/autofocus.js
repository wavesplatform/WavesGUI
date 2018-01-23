(function () {
    'use strict';

    angular.module('app.ui').directive('wAutofocus', () => ({
        restrict: 'A',
        link: function ($scope, $element) {
            const tagName = $element.get(0).tagName.toLowerCase();
            if (tagName === 'input' || tagName === 'textarea') {
                setTimeout(() => {
                    $element.focus();
                }, 100);
            }
        }
    }));
})();

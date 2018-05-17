(function () {
    'use strict';

    angular.module('app.ui').directive('wTableRow', () => ({
        bindings: {},
        replace: true,
        template: '<div class="smart-table__row" ng-transclude></div>',
        transclude: true
    }));
})();

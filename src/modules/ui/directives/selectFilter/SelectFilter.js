(function () {
    'use strict';

    angular.module('app.ui').component('wSelectFilter', {
        templateUrl: 'modules/ui/directives/selectFilter/selectFilter.html',
        bindings: {
            search: '='
        },
        transclude: true
    });
})();

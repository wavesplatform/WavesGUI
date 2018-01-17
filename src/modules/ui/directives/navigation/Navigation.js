(function () {
    'use strict';

    angular.module('app.ui').component('wNavigation', {
        transclude: true,
        bindings: {
            type: '@type'
        },
        template: '<div class="navigation {{$ctrl.type}}" ng-transclude></div>'
    });
})();

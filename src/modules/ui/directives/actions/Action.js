(function () {
    'use strict';

    angular.module('app.ui').component('wAction', {
        require: {
            parent: '^wActions'
        },
        template: '<div class="action disabled-900 body-2" ng-transclude></div>',
        transclude: true
    });
})();

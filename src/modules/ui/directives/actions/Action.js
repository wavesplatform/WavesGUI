(function () {
    'use strict';

    angular.module('app.ui').component('wAction', {
        require: {
            parent: '^wActions'
        },
        scope: false,
        templateUrl: 'modules/ui/directives/actions/action-item.html',
        transclude: true
    });
})();

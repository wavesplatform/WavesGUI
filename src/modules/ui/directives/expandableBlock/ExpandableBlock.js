(function () {
    'use strict';

    angular.module('app.ui').component('wExpandableBlock', {
        bindings: {
            title: '<'
        },
        templateUrl: 'modules/ui/directives/expandableBlock/expandableBlock.html',
        transclude: true
    });
})();

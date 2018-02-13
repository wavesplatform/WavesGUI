(function () {
    'use strict';

    angular.module('app.ui').component('wNavigationTreeItem', {
        bindings: {
            item: '<'
        },
        templateUrl: 'modules/ui/directives/navigationTree/navigationTreeItem.html',
        transclude: false
    });
})();

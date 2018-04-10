(function () {
    'use strict';

    angular.module('app.ui').component('wCopyWrap', {
        bindings: {
            info: '<'
        },
        template: '<div class="container" ng-transclude></div><div w-copy="$ctrl.info" class="copy-icon"></div>',
        transclude: true
    });
})();

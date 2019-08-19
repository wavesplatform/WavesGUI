(function () {
    'use strict';

    const container = '<div ng-click="$ctrl.onCopy()" w-copy="$ctrl.info" class="container" ng-transclude></div>';
    const copyButton = '<div ng-click="$ctrl.onCopy()" w-copy="$ctrl.info" class="copy-icon"></div>';

    angular.module('app.ui').component('wCopyWrapDefault', {
        bindings: {
            info: '<',
            onCopy: '&'
        },
        template: `${container}${copyButton}`,
        transclude: true
    });
})();

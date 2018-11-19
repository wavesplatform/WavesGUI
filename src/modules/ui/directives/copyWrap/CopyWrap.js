(function () {
    'use strict';

    const container = '<div class="container" ng-transclude></div>';
    const copyButton = '<div ng-click="$ctrl.onCopy()" w-copy="$ctrl.info" class="copy-icon"></div>';

    angular.module('app.ui').component('wCopyWrap', {
        bindings: {
            info: '<',
            onCopy: '&'
        },
        template: `${container}${copyButton}`,
        transclude: true
    });
})();

(function () {
    'use strict';

    const container = '<div class="copy-wrap__container" ng-transclude></div>';
    const copyButton = '<div ng-click="$ctrl.onCopy()" w-copy="$ctrl.info" class="copy-wrap__icon"></div>';

    angular.module('app.ui').component('wCopyWrap', {
        bindings: {
            info: '<',
            onCopy: '&'
        },
        template: `${container}${copyButton}`,
        transclude: true
    });
})();

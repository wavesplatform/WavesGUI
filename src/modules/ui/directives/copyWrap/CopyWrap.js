(function () {
    'use strict';

    /**
     * @param {NotificationManager} notificationManager
     * @return {CopyWrap}
     */
    const controller = function (notificationManager) {

        class CopyWrap {

            copy() {
                notificationManager.info({
                    ns: 'app.ui',
                    title: { literal: 'copySuccess' }
                }, 2000);
            }

        }

        return new CopyWrap();
    };

    controller.$inject = ['notificationManager'];

    angular.module('app.ui').component('wCopyWrap', {
        bindings: {
            info: '@'
        },
        template: '<div class="container" ng-transclude></div><div w-copy="{{::$ctrl.info}}" ng-click="$ctrl.copy();" class="copy-icon"></div>',
        transclude: true,
        controller
    });
})();

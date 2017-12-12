(function () {
    'use strict';

    /**
     * @param Base
     * @param copyService
     * @param {NotificationManager} notificationManager
     * @return {Copy}
     */
    const controller = function (Base, copyService, notificationManager) {

        class Copy extends Base {

            copy() {
                copyService.copy(this.info);
                notificationManager.info({
                    ns: 'app.ui',
                    title: { literal: 'copySuccess' }
                }, 2000);
            }

        }

        return new Copy();
    };

    controller.$inject = ['Base', 'copyService', 'notificationManager'];

    angular.module('app.ui').component('wCopy', {
        bindings: {
            info: '@'
        },
        template: '<div class="container" ng-transclude></div><div ng-click="$ctrl.copy();" class="copy-icon"></div>',
        transclude: true,
        controller
    });
})();

(function () {
    'use strict';

    const controller = function (Base, copyService) {

        class Copy extends Base {

            copy() {
                copyService.copy(this.info);
            }

        }

        return new Copy();
    };

    controller.$inject = ['Base', 'copyService'];

    angular.module('app.ui').component('wCopy', {
        bindings: {
            info: '@'
        },
        template: '<div class="container" ng-transclude></div><div ng-click="$ctrl.copy();" class="copy-icon"></div>',
        transclude: true,
        controller
    });
})();

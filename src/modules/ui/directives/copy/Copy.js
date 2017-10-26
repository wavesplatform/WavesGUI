(function () {
    'use strict';

    const controller = function (Base) {

        class Copy extends Base {

            copy() {
                const info = this.info;
                const handler = function (e) {
                    e.clipboardData.setData('text/plain', info);
                    e.preventDefault();
                };
                document.addEventListener('copy', handler);
                document.execCommand('copy');
                document.removeEventListener('copy', handler);
            }

        }

        return new Copy();
    };

    controller.$inject = ['Base'];

    angular.module('app.ui').component('wCopy', {
        bindings: {
            info: '@'
        },
        template: '<div class="container" ng-transclude></div><div ng-click="$ctrl.copy();" class="copy-icon"></div>',
        transclude: true,
        controller
    });
})();

(function () {
    'use strict';

    /**
     * @param Base
     * @param {PermissionManager} permissionManager
     * @return {Permit}
     */
    const controller = function (Base, permissionManager) {

        class Permit extends Base {

            $postLink() {
                this.receive(permissionManager.change, this._onChange, this);
                this._onChange();
            }

            _onChange() {
                const isPermitted = permissionManager.isPermitted(this.name);
                this.isVisible = (!isPermitted && this.mode === 'off') || (isPermitted && this.mode === 'on');
            }

        }

        return new Permit();
    };

    controller.$inject = ['Base', 'permissionManager'];

    angular.module('app.ui').component('wPermit', {
        bindings: {
            name: '@',
            mode: '@'
        },
        template: '<div ng-transclude class="w-permit" ng-if="$ctrl.isVisible"></div>',
        transclude: true,
        controller
    });
})();

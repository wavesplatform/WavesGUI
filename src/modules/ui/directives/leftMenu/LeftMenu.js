(function () {
    'use strict';

    /**
     * @param Base
     * @param {StateManager} stateManager
     * @param {ModalManager} modalManager
     * @param {*} $scope
     * @param {User} user
     * @return {LeftMenu}
     */
    const controller = function (Base, stateManager, modalManager, $scope, user) {

        class LeftMenu extends Base {

            constructor() {
                super();

                this.address = user.address;
                this.receive(stateManager.changeRouteState, () => {
                    this.subStateList = stateManager.subStateList;
                    this.rootStateList = stateManager.rootStateList;
                    $scope.$apply();
                });
                this.rootStateList = stateManager.rootStateList;
                this.subStateList = stateManager.subStateList;
                this.menuList = stateManager.getStateTree();
            }

            logout() {
                location.reload();
            }

            avatarClick() {
                modalManager.showAccountInfo();
            }

            settings() {
                modalManager.showSettings();
            }

        }

        return new LeftMenu();
    };

    controller.$inject = ['Base', 'stateManager', 'modalManager', '$scope', 'user'];

    angular.module('app.ui').component('wLeftMenu', {
        bindings: {},
        templateUrl: 'modules/ui/directives/leftMenu/leftMenu.html',
        transclude: false,
        controller
    });
})();

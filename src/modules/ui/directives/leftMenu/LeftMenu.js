(function () {
    'use strict';

    const LEFT_MENU_ROOT_ID = 'main';

    /**
     * @param Base
     * @param {StateManager} stateManager
     * @param {ModalManager} modalManager
     * @param {*} $scope
     * @return {LeftMenu}
     */
    const controller = function (Base, stateManager, modalManager, $scope) {

        class LeftMenu extends Base {

            constructor() {
                super();
                this.receive(stateManager.changeRouteState, () => {
                    this.subStateList = stateManager.subStateList;
                    this.rootStateList = stateManager.rootStateList;
                    $scope.$apply();
                });
                this.rootStateList = stateManager.rootStateList;
                this.subStateList = stateManager.subStateList;
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

    controller.$inject = ['Base', 'stateManager', 'modalManager', '$scope'];

    angular.module('app.ui').component('wLeftMenu', {
        bindings: {},
        templateUrl: 'modules/ui/directives/leftMenu/leftMenu.html',
        transclude: false,
        controller
    });
})();

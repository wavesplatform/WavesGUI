(function () {
    'use strict';

    /**
     * @param Base
     * @param {StateManager} stateManager
     * @param {ModalManager} modalManager
     * @param {User} user
     * @return {LeftMenu}
     */
    const controller = function (Base, stateManager, modalManager, user, $state) {

        class LeftMenu extends Base {

            constructor() {
                super();

                this.address = user.address;
                this.receive(stateManager.changeRouteState, () => {
                    this.subStateList = stateManager.subStateList;
                    this.rootStateList = stateManager.rootStateList;
                });
                this.rootStateList = stateManager.rootStateList;
                this.subStateList = stateManager.subStateList;
                this.menuList = stateManager.getStateTree();
                this.activeState = $state.$current.name.slice($state.$current.name.lastIndexOf('.') + 1);
            }

            logout() {
                user.logout();
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

    controller.$inject = ['Base', 'stateManager', 'modalManager', 'user', '$state'];

    angular.module('app.ui').component('wLeftMenu', {
        bindings: {},
        templateUrl: 'modules/ui/directives/leftMenu/leftMenu.html',
        transclude: false,
        controller
    });
})();

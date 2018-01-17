(function () {
    'use strict';

    const LEFT_MENU_ROOT_ID = 'main';

    /**
     * @param Base
     * @param {User} user
     * @param {State} state
     * @param {ModalManager} modalManager
     * @return {LeftMenu}
     */
    const controller = function (Base, user, state, modalManager) {

        class LeftMenu extends Base {

            constructor() {
                super();
                this._initStateList();
                this.address = user.address;
                this.receive(state.signals.changeRouterState, this._initStateList, this);
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

            _initStateList() {
                const root = WavesApp.stateTree.find(LEFT_MENU_ROOT_ID);
                const rootPath = WavesApp.stateTree.getPath(LEFT_MENU_ROOT_ID).join('.');
                this.stateList = root.getChildren()
                    .map((item) => {
                        const path = user.getActiveState(item.id);
                        const base = `${rootPath}.${item.id}`;
                        return { path, name: item.id, base };
                    });
            }

        }

        return new LeftMenu();
    };

    controller.$inject = ['Base', 'user', 'state', 'modalManager'];

    angular.module('app.ui').component('wLeftMenu', {
        bindings: {},
        templateUrl: 'modules/ui/directives/leftMenu/leftMenu.html',
        transclude: false,
        controller
    });
})();

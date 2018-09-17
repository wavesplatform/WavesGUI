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

                this.address = user.address || '3PHBX4uXhCyaANUxccLHNXw3sqyksV7YnDz';
                this.isLogined = !!user.address;
                this.receive(stateManager.changeRouteState, () => {
                    this.subStateList = stateManager.subStateList;
                    this.rootStateList = stateManager.rootStateList;
                });
                this.rootStateList = stateManager.rootStateList;
                this.subStateList = stateManager.subStateList;
                this.menuList = stateManager.getStateTree();
                this.activeState = $state.$current.name.slice($state.$current.name.lastIndexOf('.') + 1);
                this.userType = user.userType;
                if (!this.isLogined) {
                    this.activeState = this.activeState.replace('-demo', '');
                }
            }

            open(sref) {
                if (this.isLogined) {
                    $state.go(sref);
                } else {
                    this._getDialogModal(`open-${sref}`, () => $state.go('welcome'), () => $state.go('create'));
                }
            }

            logout() {
                user.logout();
            }

            avatarClick() {
                if (this.isLogined) {
                    modalManager.showAccountInfo();
                } else {
                    this._getDialogModal('account', () => $state.go('welcome'), () => $state.go('create'));
                }
            }

            settings() {
                if (this.isLogined) {
                    modalManager.showSettings();
                } else {
                    this._getDialogModal('settings', () => $state.go('welcome'), () => $state.go('create'));
                }
            }

            _getDialogModal(type, success, error) {
                return modalManager.showDialogModal({
                    iconClass: `${type.replace(/\./g, '-')}-account-info`,
                    message: { literal: `modal.${type}.message` },
                    buttons: [
                        {
                            success: false,
                            classes: 'big',
                            text: { literal: `modal.${type}.cancel` },
                            click: error
                        },
                        {
                            success: true,
                            classes: 'big submit',
                            text: { literal: `modal.${type}.ok` },
                            click: success
                        }
                    ]
                });
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

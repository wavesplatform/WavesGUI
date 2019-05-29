(function () {
    'use strict';

    /**
     * @param Base
     * @param {StateManager} stateManager
     * @param {ModalManager} modalManager
     * @param {User} user
     * @param {$state} $state
     * @param {JQuery} $document
     * @param {JQuery} $element
     * @return {SiteHeader}
     */
    const controller = function (Base, stateManager, modalManager, user, $state, $element, $document) {

        class SiteHeaderCtrl extends Base {

            /**
             * @public
             * @type {string}
             */
            userName;

            constructor() {
                super();
                this.hovered = false;
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
                this.userName = user.name;

                this.isScript = user.hasScript();
                this.isKeeper = user.userType === 'wavesKeeper';
                this.isLedger = user.userType === 'ledger';

                this.hasTypeHelp = this.isScript && (this.isLedger || this.isKeeper);
                this._initClickHandlers();
            }

            $onDestroy() {
                super.$onDestroy();
                $element.find('.mobile-menu-fader, .mobile-menu-toggler').off();
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

            /**
             * public
             */
            toWelcome() {
                if (this.isLogined) {
                    return modalManager.showConfirmLogout().then(() => {
                        user.logout();
                    });
                }
            }

            /**
             * public
             */
            removeBodyClass() {
                $document.find('body').removeClass('menu-is-shown');
            }

            /**
             * @private
             */
            _initClickHandlers() {
                $element.find('.mobile-menu-fader, .mobile-menu-toggler').on('click', () => {
                    $element.find('header').toggleClass('expanded');
                    $document.find('body').toggleClass('menu-is-shown');
                });
            }


        }

        return new SiteHeaderCtrl();
    };

    controller.$inject = ['Base', 'stateManager', 'modalManager', 'user', '$state', '$element', '$document'];

    angular.module('app.ui').component('wSiteHeader', {
        bindings: {
            signInBtn: '<',
            getStartedBtn: '<'
        },
        templateUrl: 'modules/ui/directives/siteHeader/siteHeader.html',
        transclude: false,
        controller
    });
})();

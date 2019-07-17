(function () {
    'use strict';

    const SELECTORS = {
        MAIN_HEADER_USER: 'js-main-header-user',
        MAIN_HEADER_FADER: 'js-main-header-fader',
        TOOLTIP_RENAME: 'js-tooltip-rename',
        HEADER: 'js-header'
    };

    /**
     * @param Base
     * @param {stateManager} stateManager
     * @param {ModalManager} modalManager
     * @param {app.utils} utils
     * @param $scope
     * @param {User} user
     * @param {$state} $state
     * @param {JQuery} $document
     * @param {JQuery} $element
     * @param {UserNameService} userNameService
     * @return {MainHeaderCtrl}
     */
    const controller = function (Base,
                                 stateManager,
                                 modalManager,
                                 user,
                                 $state,
                                 $element,
                                 $document,
                                 utils,
                                 $scope,
                                 userNameService) {

        const PATH = 'modules/ui/directives/mainHeader/templates';
        class MainHeaderCtrl extends Base {

            /**
             * @public
             * @type {string}
             */
            userName;
            /**
             * @public
             * @type {Array}
             */
            userList = [];
            /**
             * @public
             * @type {boolean}
             */
            isUniqueUserName = true;
            /**
             * @type {boolean}
             */
            showInput = false;

            constructor() {
                super($scope);

                $scope.ERROR_DISPLAY_INTERVAL = 3;
                $scope.user = user;
                $scope.SELECTORS = SELECTORS;

                $scope.MAX_USER_NAME_LENGTH = userNameService.MAX_USER_NAME_LENGTH;
                this.userName = userNameService.name;

                this.address = user.address || '3PHBX4uXhCyaANUxccLHNXw3sqyksV7YnDz';
                this.isLogined = !!user.address;
                this.userType = user.userType;
                this.isDesktop = WavesApp.isDesktop();

                this.isScript = user.hasScript();
                this.isKeeper = user.userType === 'wavesKeeper';
                this.isLedger = user.userType === 'ledger';

                this.hasTypeHelp = this.isScript && (this.isLedger || this.isKeeper);

                user.getFilteredUserList().then(list => {
                    this.userList = list;
                });

                this.largeTemplate = `${PATH}/largeHeader.html`;
                this.mobileTemplate = `${PATH}/mobileHeader.html`;

                this.observe('userName', () => {
                    userNameService.setName(this.userName);
                    this.isUniqueUserName = userNameService.isUniqueName();
                });

                this.receive(utils.observe(userNameService, 'name'), function () {
                    this.userName = userNameService.name;
                }, this);

                this.observe('isUniqueUserName', () => {
                    if (this.setUserName) {
                        this.setUserName.userName.$setValidity('user-name-unique', this.isUniqueUserName);
                    }
                });

            }

            /**
             * @public
             */
            hideTooltip() {
                $element.find(`.${SELECTORS.TOOLTIP_RENAME}`).hide();
            }

            /**
             * @public
             */
            onFocus() {
                this.hideTooltip();
            }

            /**
             * @public
             */
            showTooltip() {
                $element.find(`.${SELECTORS.TOOLTIP_RENAME}`).show();
            }

            /**
             * @public
             */
            onBlur() {
                this._saveUserName();
                this.showTooltip();
                this.toggleNameView();
            }

            $onDestroy() {
                super.$onDestroy();
            }

            /**
             * @public
             */
            logout() {
                user.logout();
            }

            /**
             * @public
             */
            showAliases() {
                this.removeBodyClass();
                if (this.isLogined) {
                    modalManager.showAccountInfo();
                } else {
                    this._getDialogModal(
                        'account',
                        () => $state.go('welcome'),
                        () => $state.go('create')
                    );
                }
            }

            /**
             * @public
             */
            changeName() {
                this.removeBodyClass();
                if (this.isLogined) {
                    modalManager.showAccountChangeName();
                } else {
                    this._getDialogModal(
                        'account',
                        () => $state.go('welcome'),
                        () => $state.go('create')
                    );
                }
            }

            /**
             * @public
             */
            showAddress() {
                this.removeBodyClass();
                if (this.isLogined) {
                    modalManager.showAccountAddress();
                } else {
                    this._getDialogModal(
                        'account',
                        () => $state.go('welcome'),
                        () => $state.go('create')
                    );
                }
            }

            /**
             * @public
             */
            showSettings() {
                this.removeBodyClass();
                if (this.isLogined) {
                    modalManager.showSettings();
                } else {
                    this._getDialogModal(
                        'settings',
                        () => $state.go('welcome'),
                        () => $state.go('create')
                    );
                }
            }

            /**
             * public
             */
            removeInnerMenu() {
                $document.find(`.${SELECTORS.HEADER}`).removeClass(
                    'show-wallet show-aliases show-downloads show-address'
                );
            }

            /**
             * public
             */
            removeBodyClass() {
                $document.find('body').removeClass('menu-is-shown');
            }

            /**
             * public
             */
            toggleNameView() {
                this.showInput = !this.showInput;
                utils.postDigest($scope).then(() => {
                    if (this.showInput) {
                        this.setUserName.userName.$$element.focus();
                    }
                });
            }

            /**
             * public
             */
            toggleDropdown() {
                $element.find(`.${SELECTORS.MAIN_HEADER_USER}`).toggleClass('open');
                $element.find(`.${SELECTORS.MAIN_HEADER_FADER}`).toggleClass('show-fader');
            }

            /**
             * public
             */
            closeDropdown() {
                const mainHeaderUser = $element.find(`.${SELECTORS.MAIN_HEADER_USER}`);
                if (mainHeaderUser.hasClass('open')) {
                    mainHeaderUser.removeClass('open');
                    $element.find(`.${SELECTORS.MAIN_HEADER_FADER}`).removeClass('show-fader');
                }
            }

            /**
             * public
             */
            onMobileTogglerClick() {
                this.removeInnerMenu();
                $element.find(`.${SELECTORS.HEADER}`).toggleClass('expanded');
                this.removeBodyClass();
            }

            /**
             * public
             */
            onMobileFaderClick() {
                $element.find(`.${SELECTORS.HEADER}`).removeClass('expanded');
                this.removeBodyClass();
            }

            /**
             * @param type
             * @param success
             * @param error
             * @return {Promise}
             * @private
             */
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
             * @private
             */
            _saveUserName() {
                userNameService.save();
            }

        }

        return new MainHeaderCtrl();
    };

    controller.$inject = [
        'Base',
        'stateManager',
        'modalManager',
        'user',
        '$state',
        '$element',
        '$document',
        'utils',
        '$scope',
        'userNameService'
    ];

    angular.module('app.ui').component('wMainHeader', {
        bindings: {
            userList: '<'
        },
        templateUrl: 'modules/ui/directives/mainHeader/templates/mainHeader.html',
        transclude: false,
        controller
    });
})();

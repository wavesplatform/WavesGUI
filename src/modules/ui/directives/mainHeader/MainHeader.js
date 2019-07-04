(function () {
    'use strict';

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

            constructor() {
                super($scope);

                $scope.ERROR_DISPLAY_INTERVAL = 3;
                $scope.user = user;

                $scope.MAX_USER_NAME_LENGTH = userNameService.MAX_USER_NAME_LENGTH;
                this.userName = userNameService.name;

                this.hovered = false;
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
                    utils.postDigest($scope).then(() => {
                        this._initFader();
                        this._initClickHandlers();
                        $scope.$apply();
                    });
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
            }

            $postLink() {
                this._initClickHandlers();
            }

            /**
             * @public
             */
            hideTooltip() {
                $element.find('.account-name-wrapper w-info-tooltip').hide();
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
                $element.find('.account-name-wrapper w-info-tooltip').show();
            }

            /**
             * @public
             */
            onBlur() {
                this.showTooltip();
                this._saveUserName();
            }

            $onDestroy() {
                super.$onDestroy();
                $element.find('.mobile-menu-fader, .mobile-menu-toggler').off();
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
            avatarClick() {
                $document.find('body').removeClass('menu-is-shown');
                if (this.isLogined) {
                    modalManager.showAccountInfo();
                } else {
                    this._getDialogModal('account', () => $state.go('welcome'), () => $state.go('create'));
                }
            }

            /**
             * @public
             */
            changeNameClick() {
                $document.find('body').removeClass('menu-is-shown');
                if (this.isLogined) {
                    modalManager.showAccountChangeName();
                } else {
                    this._getDialogModal('account', () => $state.go('welcome'), () => $state.go('create'));
                }
            }

            /**
             * @public
             */
            showAddressClick() {
                $document.find('body').removeClass('menu-is-shown');
                if (this.isLogined) {
                    modalManager.showAccountAddress();
                } else {
                    this._getDialogModal('account', () => $state.go('welcome'), () => $state.go('create'));
                }
            }

            /**
             * @public
             */
            settings() {
                $document.find('body').removeClass('menu-is-shown');
                if (this.isLogined) {
                    modalManager.showSettings();
                } else {
                    this._getDialogModal('settings', () => $state.go('welcome'), () => $state.go('create'));
                }
            }

            /**
             * public
             */
            removeInnerMenu() {
                $document.find('w-main-header header').removeClass('show-wallet show-aliases show-downloads');
            }

            /**
             * public
             */
            removeBodyClass() {
                $document.find('body').removeClass('menu-is-shown');
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
            _initClickHandlers() {
                $element.find('.mobile-menu-toggler').on('click', () => {
                    $element.find('.main-header__header').toggleClass('expanded');
                    $document.find('body').toggleClass('menu-is-shown');
                });
                $element.find('.mobile-menu-fader').on('click', () => {
                    $element.find('.main-header__header').removeClass('expanded');
                    $document.find('body').removeClass('menu-is-shown');
                });
            }

            /**
             * @private
             */
            _initFader() {
                $element.find('.dropdown-toggler').on('mouseover', () => {
                    $element.find('.main-header__fader').addClass('show-fader');
                });
                $element.find('.dropdown-toggler').on('mouseleave', () => {
                    $element.find('.main-header__fader').removeClass('show-fader');
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

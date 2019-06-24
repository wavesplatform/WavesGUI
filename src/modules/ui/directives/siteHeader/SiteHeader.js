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
     * @param {app.i18n} i18n
     * @return {SiteHeaderCtrl}
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
                                 i18n) {

        const PATH = 'modules/ui/directives/siteHeader/templates';

        class SiteHeaderCtrl extends Base {

            /**
             * @public
             * @type {string}
             */
            userName;
            /**
             * @public
             * @type {string}
             */
            defaultUserName;
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
             * @public
             * @type {boolean}
             */
            isUserNameLengthValid = true;

            constructor() {
                super($scope);

                $scope.user = user;
                $scope.ERROR_DISPLAY_INTERVAL = 3;
                $scope.MAX_USER_NAME_LENGTH = 20;

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
                    this.hasUsers = this.userList.length > 0;
                    utils.postDigest($scope).then(() => {
                        this._initFader();
                        this._initClickHandlers();
                        $scope.$apply();
                    });
                });

                this.largeTemplate = `${PATH}/largeHeader.html`;
                this.mobileTemplate = `${PATH}/mobileHeader.html`;

                this.observe('userName', this._onChangeUserName);
                this.observe('defaultUserName', () => {
                    this.userName = user.name ? user.name : this.defaultUserName;
                });
                this._setDefaultUserName();
                this.listenEventEmitter(i18next, 'languageChanged', this._setDefaultUserName.bind(this));
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
            showTooltip() {
                $element.find('.account-name-wrapper w-info-tooltip').show();
            }

            /**
             * @public
             */
            setUserName() {
                if (!this.userName) {
                    this.userName = this.defaultUserName;
                    user.name = null;
                }
            }

            /**
             * @public
             */
            handleBlur() {
                this.showTooltip();
                this.setUserName();
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
            changeAddressClick() {
                $document.find('body').removeClass('menu-is-shown');
                if (this.isLogined) {
                    modalManager.showAccountChangeAddress();
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
                $document.find('w-site-header header').removeClass('show-wallet show-aliases show-downloads');
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
                    $element.find('header').toggleClass('expanded');
                    $document.find('body').toggleClass('menu-is-shown');
                });
                $element.find('.mobile-menu-fader').on('click', () => {
                    $element.find('header').removeClass('expanded');
                    $document.find('body').removeClass('menu-is-shown');
                });
            }

            /**
             * @private
             */
            _initFader() {
                $element.find('.dropdown-toggler').on('mouseover', () => {
                    $element.find('.dropdown-fader').addClass('show-fader');
                });
                $element.find('.dropdown-toggler').on('mouseleave', () => {
                    $element.find('.dropdown-fader').removeClass('show-fader');
                });
            }

            /**
             * @private
             */
            _onChangeUserName() {
                this._setIsUniqueUserName();
                this._setIsUserNameLengthValid();
                const isUserNameValid = this.isUniqueUserName && this.isUserNameLengthValid;

                if (isUserNameValid && this.userName !== this.defaultUserName) {
                    user.name = this.userName;
                }
            }

            /**
             * @private
             */
            _setIsUniqueUserName() {
                this.isUniqueUserName =
                    !this.userName ||
                    this.userList
                        .filter(user => user.address !== this.address)
                        .every(user => user.name !== this.userName);
            }

            /**
             * @private
             */
            _setIsUserNameLengthValid() {
                this.isUserNameLengthValid = this.userName ? this.userName.length <= $scope.MAX_USER_NAME_LENGTH : true;
            }

            _setDefaultUserName() {
                this.defaultUserName = i18n.translate('welcome.account', 'app.welcome');
            }

        }

        return new SiteHeaderCtrl();
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
        'i18n'
    ];

    angular.module('app.ui').component('wSiteHeader', {
        bindings: {
            signInBtn: '<',
            getStartedBtn: '<'
        },
        templateUrl: 'modules/ui/directives/siteHeader/templates/siteHeader.html',
        transclude: false,
        controller
    });
})();

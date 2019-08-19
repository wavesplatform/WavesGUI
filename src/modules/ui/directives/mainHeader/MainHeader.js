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
     * @param {ng.IScope} $scope
     * @param {User} user
     * @param {*} $state
     * @param {JQuery} $document
     * @param {JQuery} $element
     * @param {UserNameService} userNameService
     * @param {MultiAccount} multiAccount
     * @return {MainHeaderCtrl}
     */
    const controller = function (
        Base,
        stateManager,
        modalManager,
        user,
        $state,
        $element,
        $document,
        utils,
        $scope,
        userNameService,
        multiAccount
    ) {

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
             * @type {Array}
             */
            userListLocked = [];
            /**
             * @public
             * @type {boolean}
             */
            hasMultiAccount = false;
            /**
             * @public
             * @type {boolean}
             */
            isUniqueUserName = true;
            /**
             * @type {boolean}
             */
            showInput = false;
            /**
             * @type {number}
             */
            isMenuOpen = 0;
            /**
             * @type {boolean}
             */
            isShowAccounts = false;

            get isSignedIn() {
                return multiAccount.isSignedIn;
            }

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

                this.largeTemplate = `${PATH}/largeHeader.html`;
                this.mobileTemplate = `${PATH}/mobileHeader.html`;

                user.onLogin().then(
                    () => this._handleLogin(),
                    () => this._handleLogout()
                );

                this.observe('userName', () => {
                    userNameService.setName(this.userName);
                    userNameService.isUniqueName()
                        .then(data => {
                            this.isUniqueUserName = data;
                        });
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
            onBlur() {
                if (!this.userName) {
                    this.onCancel();
                } else if (this.showInput) {
                    userNameService.save()
                        .then(() => {
                            this.setNameView(false);
                            this.showTooltip();
                        });
                }

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
            onCancel() {
                this.showTooltip();
                this.setNameView();
                this._resetUserName();
            }

            /**
             * @public
             */
            onSave() {
                userNameService.save()
                    .then(() => {
                        this.showTooltip();
                        this.setNameView();
                    });
            }

            /**
             * @public
             */
            logout() {
                user.logout('signIn');
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

            toggleAccounts() {
                this.isMenuOpen = !this.isMenuOpen;
                this.isShowAccounts = !this.isShowAccounts;
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
            toggleBodyClass() {
                $document.find('body').toggleClass('menu-is-shown');
            }

            /**
             * public
             * @param {boolean} value
             */
            setNameView(value) {
                this.showInput = value !== undefined ? value : !this.showInput;
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
                    this.onBlur();
                }

                this.isShowAccounts = false;
                this.isMenuOpen = false;
            }

            /**
             * public
             */
            onMobileTogglerClick() {
                this.removeInnerMenu();
                $element.find(`.${SELECTORS.HEADER}`).toggleClass('expanded');
                this.toggleBodyClass();
            }

            /**
             * public
             */
            onMobileFaderClick() {
                $element.find(`.${SELECTORS.HEADER}`).removeClass('expanded');
                this.removeBodyClass();
            }

            switchUser(toUser) {
                user.logout('.', true);
                user.login(toUser);
            }

            unlockUser(userToUnlock) {
                $state.go('migrate', {
                    id: multiAccount.hash(userToUnlock.address)
                });
            }

            deleteUser(userToDelete) {
                modalManager.showConfirmDeleteUser(userToDelete).then(() => {
                    if (userToDelete.hash) {
                        return user.deleteMultiAccountUser(userToDelete.hash).then(() => {
                            this.userList = this.userList.filter(
                                userInList => userInList.hash !== userToDelete.hash
                            );

                            if (this.userList.length === 0) {
                                $state.go('create');
                            }
                        });
                    } else {
                        return user.removeUserByAddress(userToDelete.address).then(() => {
                            this.userListLocked = this.userList.filter(
                                userInList => userInList.address !== userToDelete.address
                            );
                        });
                    }
                });
            }

            /**
             * @private
             */
            _handleLogin() {
                this._resetUserFields();

                user.getMultiAccountUsers().then((users = []) => {
                    this.userList = users.filter(x => x.hash !== user.hash);
                });

                user.getFilteredUserList().then((users = []) => {
                    this.userListLocked = users;
                });

                user.logoutSignal.once(this._handleLogout, this);
            }

            /**
             * @private
             */
            _handleLogout() {
                this._resetUserFields();

                user.loginSignal.once(this._handleLogin, this);
            }

            /**
            * @private
            */
            _resetUserFields() {
                this.address = user.address || '3PHBX4uXhCyaANUxccLHNXw3sqyksV7YnDz';
                this.isLogined = !!user.address;
                this.userName = user.name;
                this.userType = user.userType;
                this.isScript = user.hasScript();
                this.isKeeper = user.userType === 'wavesKeeper';
                this.isLedger = user.userType === 'ledger';
                this.hasTypeHelp = this.isScript && (this.isLedger || this.isKeeper);
                this.userList = [];

                user.getMultiAccountData().then(data => {
                    this.hasMultiAccount = !!data;
                });
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
            _resetUserName() {
                userNameService.setName(user.name);
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
        'userNameService',
        'multiAccount'
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

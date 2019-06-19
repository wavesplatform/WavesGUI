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
                                 $scope) {

        const PATH = 'modules/ui/directives/siteHeader/templates';

        class SiteHeaderCtrl extends Base {

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

            constructor() {
                super($scope);
                this.hovered = false;
                this.address = user.address || '3PHBX4uXhCyaANUxccLHNXw3sqyksV7YnDz';
                this.isLogined = !!user.address;
                this.userName = user.name;
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
                        $scope.$apply();
                    });
                });

                this._initClickHandlers();
                this.largeTemplate = `${PATH}/largeHeader.html`;
                this.mobileTemplate = `${PATH}/mobileHeader.html`;
            }


            $postLink() {
                this._initClickHandlers();
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
                $element.find('.mobile-menu-fader, .mobile-menu-toggler').on('click', () => {
                    $element.find('header').toggleClass('expanded');
                    $document.find('body').toggleClass('menu-is-shown');
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
        '$scope'
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

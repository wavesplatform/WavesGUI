(() => {
    'use strict';

    const analytics = require('@waves/event-sender');

    /**
     * @param {typeof Base} Base
     * @param {ng.IScope} $scope
     * @param {*} $state
     * @param {User} user
     * @param {ModalManager} modalManager
     * @param {ConfigService} configService
     * @param {Storage} storage
     * @returns {SignInCtrl}
     */
    const controller = function (Base, $scope, $state, user, modalManager, configService, storage) {

        class SignInCtrl extends Base {

            /**
             * @type {Array|null}
             */
            legacyUserList = null;
            /**
             * @type {Array}
             * @private
             */
            _onLoginHandlers = [];

            constructor() {
                super($scope);

                analytics.send({ name: 'Onboarding Sign In Show', target: 'ui', params: { from: 'sign-in' } });

                Promise.all([
                    user.getMultiAccountData(),
                    user.getFilteredUserList()
                ]).then(([multiAccountData, userList]) => {
                    if (!multiAccountData) {
                        $state.go('signUp');
                    } else {
                        this.legacyUserList = userList;
                    }
                });

                this._onLoginHandlers.push(this._showMigrateModal);

                user.onLogin().then(() => {
                    this._onLoginHandlers.forEach((handler) => handler());
                });
            }

            $onDestroy() {
                super.$onDestroy();
                this._onLoginHandlers = [];
            }

            onLogin() {
                Promise.all([
                    user.getMultiAccountUsers(),
                    user.getMultiAccountSettings()
                ]).then(([multiAccountUsers, commonSettings]) => {
                    const [firstUser] = multiAccountUsers;

                    user.setMultiAccountSettings(commonSettings);

                    if (firstUser) {
                        user.login(firstUser).then(() => {
                            user.goToActiveState();
                        });
                    } else if (this.legacyUserList && this.legacyUserList.length) {
                        $state.go('migrate');
                    } else {
                        $state.go('create');
                    }
                }).catch(() => {
                    return null;
                });
            }

            onResetPassword() {
                $state.go('signUp');
            }

            showForgotPasswordModal() {
                modalManager.showForgotPasswordModal().then(() => {
                    $state.go('signUp');
                });
            }

            _login(userData) {
                user.login(userData).then(() => {
                    const DEXW_LOCKED = configService.get('DEXW_LOCKED');

                    if (DEXW_LOCKED) {
                        $state.go('migration');
                    } else {
                        user.goToActiveState();
                    }
                });
            }

            _showPasswordError() {
                this.password = '';
                this.showPasswordError = true;
            }

            _updatePassword() {
                if (this.password) {
                    this.showPasswordError = false;
                }
            }

            _showMigrateModal = () => {
                storage.load('notAutoOpenMigrationModal').then((notAutoOpenMigrationModal) => {
                    if (!notAutoOpenMigrationModal) {
                        modalManager.showMigrateModal();
                    }
                });
            };

        }

        return new SignInCtrl();
    };

    controller.$inject = ['Base', '$scope', '$state', 'user', 'modalManager', 'configService', 'storage'];

    angular.module('app.signIn').controller('SignInCtrl', controller);
})();

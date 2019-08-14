(function () {
    'use strict';

    const analytics = require('@waves/event-sender');

    /**
     * @param Base
     * @param $scope
     * @param $state
     * @param user
     * @param multiAccount
     * @param modalManager
     * @returns {SignInCtrl}
     */
    const controller = function (Base, $scope, $state, user, multiAccount, modalManager) {

        class SignInCtrl extends Base {

            /**
             * @type {string}
             */
            password = '';
            /**
             * @type {ng.IFormController|null}
             */
            loginForm = null;
            /**
             * @type {string}
             */
            multiAccountData = '';
            /**
             * @type {string}
             */
            multiAccountHash = '';
            /**
             * @type {Array|null}
             */
            userList = null;

            constructor() {
                super($scope);

                this.observe('password', this._updatePassword);

                analytics.send({ name: 'Onboarding Sign In Show', target: 'ui', params: { from: 'sign-in' } });

                Promise.all([
                    user.getMultiAccountData(),
                    user.getMultiAccountHash(),
                    user.getFilteredUserList()
                ]).then(([multiAccountData, multiAccountHash, userList]) => {
                    if (!multiAccountData) {
                        $state.go('signUp');
                    } else {
                        this.multiAccountData = multiAccountData;
                        this.multiAccountHash = multiAccountHash;
                        this.userList = userList;
                    }
                });
            }

            onSubmit() {
                this.showPasswordError = false;

                multiAccount.signIn(
                    this.multiAccountData,
                    this.password,
                    user.getSetting('encryptionRounds'),
                    this.multiAccountHash
                ).then(
                    () => user.getMultiAccountUsers(),
                    () => {
                        this._showPasswordError();
                        return Promise.reject();
                    }
                ).then(multiAccountUsers => {
                    const [firstUser] = multiAccountUsers;

                    if (firstUser) {
                        this._login(firstUser);
                    } else if (this.userList && this.userList.length) {
                        $state.go('migrate');
                    } else {
                        $state.go('create');
                    }
                });
            }

            showTutorialModals() {
                return modalManager.showTutorialModals();
            }

            _login(userData) {
                user.login(userData).then(() => {
                    $state.go(user.getActiveState('wallet'));
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

        }

        return new SignInCtrl();
    };

    controller.$inject = ['Base', '$scope', '$state', 'user', 'multiAccount', 'modalManager'];

    angular.module('app.signIn').controller('SignInCtrl', controller);
})();

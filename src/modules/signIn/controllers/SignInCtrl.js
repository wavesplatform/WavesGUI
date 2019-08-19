(function () {
    'use strict';

    const analytics = require('@waves/event-sender');

    /**
     * @param {typeof Base} Base
     * @param {ng.IScope} $scope
     * @param {*} $state
     * @param {User} user
     * @param {MultiAccount} multiAccount
     * @returns {SignInCtrl}
     */
    const controller = function (Base, $scope, $state, user, multiAccount) {

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
            legacyUserList = null;

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
                        this.legacyUserList = userList;
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
                    } else if (this.legacyUserList && this.legacyUserList.length) {
                        $state.go('migrate');
                    } else {
                        $state.go('create');
                    }
                });
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

    controller.$inject = ['Base', '$scope', '$state', 'user', 'multiAccount'];

    angular.module('app.signIn').controller('SignInCtrl', controller);
})();

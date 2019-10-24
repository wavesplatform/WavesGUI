(() => {
    'use strict';

    const analytics = require('@waves/event-sender');

    /**
     * @param {typeof Base} Base
     * @param {ng.IScope} $scope
     * @param {*} $state
     * @param {User} user
     * @returns {SignInCtrl}
     */
    const controller = function (Base, $scope, $state, user) {

        class SignInCtrl extends Base {

            /**
             * @type {Array|null}
             */
            legacyUserList = null;

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

        }

        return new SignInCtrl();
    };

    controller.$inject = ['Base', '$scope', '$state', 'user', 'multiAccount', 'modalManager'];

    angular.module('app.signIn').controller('SignInCtrl', controller);
})();

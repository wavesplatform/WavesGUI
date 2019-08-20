(() => {
    'use strict';

    /**
     * @param {typeof Base} Base
     * @param {ng.IScope} $scope
     * @param {*} $state
     * @param {MultiAccount} multiAccount
     * @param {User} user
     * @return {SignUpCtrl}
     */
    const controller = function (Base, $scope, $state, multiAccount, user) {

        class SignUpCtrl extends Base {

            /**
             * @type {ng.IFormController|null}
             */
            form = null;
            password = '';
            confirmPassword = '';
            activeStep = 0;
            hasLegacyUsers = false;

            constructor() {
                super($scope);

                Promise.all([
                    user.getMultiAccountData(),
                    user.getFilteredUserList()
                ]).then(([multiAccountData, userList]) => {
                    if (multiAccountData) {
                        if (user.isAuthorised) {
                            $state.go(user.getActiveState('wallet'));
                        } else {
                            $state.go('signIn');
                        }
                    } else {
                        this.hasLegacyUsers = userList && userList.length > 0;
                        this.activeStep = this.hasLegacyUsers ? 0 : 1;
                    }
                });
            }

            nextStep() {
                this.activeStep += 1;
            }

            onSubmit() {
                multiAccount.signUp(
                    this.password,
                    user.getSetting('encryptionRounds')
                ).then(
                    data => user.saveMultiAccount(data)
                ).then(() => {
                    if (this.hasLegacyUsers) {
                        $state.go('migrate');
                    } else {
                        $state.go('create');
                    }
                });
            }

        }

        return new SignUpCtrl();
    };

    controller.$inject = ['Base', '$scope', '$state', 'multiAccount', 'user'];

    angular.module('app.signUp').controller('SignUpCtrl', controller);
})();

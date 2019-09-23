(() => {
    'use strict';

    /**
     * @param {typeof Base} Base
     * @param {ng.IScope} $scope
     * @param {*} $state
     * @param {MultiAccount} multiAccount
     * @param {User} user
     * @param {app.Storage} storage
     * @return {SignUpCtrl}
     */
    const controller = function (Base, $scope, $state, multiAccount, user, storage) {

        class SignUpCtrl extends Base {

            /**
             * @type {ng.IFormController|null}
             */
            form = null;
            password = '';
            confirmPassword = '';
            termsAgreement = false;

            activeStep = 0;
            hasLegacyUsers = false;
            termsAccepted = false;

            get invalid() {
                return this.form.$invalid || (
                    !this.termsAccepted &&
                    !this.termsAgreement
                );
            }

            constructor() {
                super($scope);

                Promise.all([
                    user.getMultiAccountData(),
                    user.getFilteredUserList(),
                    storage.load('termsAccepted')
                ]).then(([multiAccountData, userList, termsAccepted]) => {
                    this.termsAccepted = termsAccepted;

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
                ).then(data => Promise.all([
                    user.saveMultiAccount(data),
                    storage.save('termsAccepted', true)
                ])).then(() => {
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

    controller.$inject = ['Base', '$scope', '$state', 'multiAccount', 'user', 'storage'];

    angular.module('app.signUp').controller('SignUpCtrl', controller);
})();

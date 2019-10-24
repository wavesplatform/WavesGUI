(() => {
    'use strict';

    /**
     * @param {typeof Base} Base
     * @param {ng.IScope} $scope
     * @param {*} $state
     * @param {User} user
     * @param {MultiAccount} multiAccount
     * @param {ModalManager} modalManager
     * @returns {SignInFormCtrl}
     */
    const controller = function (Base, $scope, $state, user, multiAccount, modalManager) {

        class SignInFormCtrl extends Base {

            /**
             * @type {string}
             */
            password = '';
            /**
             * @type {ng.IFormController|null}
             */
            form = null;
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
                if (this.form.$invalid) {
                    return;
                }

                this.showPasswordError = false;

                multiAccount.signIn(
                    this.multiAccountData,
                    this.password,
                    undefined,
                    this.multiAccountHash
                ).then(() => {
                    this.onSuccess();
                }).catch(() => {
                    this._showPasswordError();
                });
            }

            showForgotPasswordModal() {
                modalManager.showForgotPasswordModal().then(() => {
                    this.onResetPassword();
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

        return new SignInFormCtrl();
    };

    controller.$inject = ['Base', '$scope', '$state', 'user', 'multiAccount', 'modalManager'];

    angular.module('app.signIn').component('wSignInForm', {
        templateUrl: 'modules/signIn/components/signInForm/signInForm.html',
        controller,
        bindings: {
            onSuccess: '&',
            onResetPassword: '&'
        }
    });
})();

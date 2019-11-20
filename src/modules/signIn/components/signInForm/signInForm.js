(() => {
    'use strict';

    class SignInFormCtrl {

        static $inject = ['$state', 'user', 'multiAccount', 'modalManager'];

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

        /**
         * @param {*} $state
         * @param {User} user
         * @param {MultiAccount} multiAccount
         * @param {ModalManager} modalManager
         */
        constructor($state, user, multiAccount, modalManager) {
            this.$state = $state;
            this.user = user;
            this.multiAccount = multiAccount;
            this.modalManager = modalManager;
        }

        $onInit() {
            Promise.all([
                this.user.getMultiAccountData(),
                this.user.getMultiAccountHash(),
                this.user.getFilteredUserList()
            ]).then(([multiAccountData, multiAccountHash, userList]) => {
                if (!multiAccountData) {
                    this.$state.go('signUp');
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

            this.multiAccount.signIn(
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
            this.modalManager.showForgotPasswordModal().then(() => {
                this.onResetPassword();
            });
        }

        onPasswordChange() {
            if (this.password) {
                this.showPasswordError = false;
            }
        }

        _showPasswordError() {
            this.password = '';
            this.showPasswordError = true;
        }

    }

    angular.module('app.signIn').component('wSignInForm', {
        templateUrl: 'modules/signIn/components/signInForm/signInForm.html',
        controller: SignInFormCtrl,
        bindings: {
            onSuccess: '&',
            onResetPassword: '&'
        }
    });
})();

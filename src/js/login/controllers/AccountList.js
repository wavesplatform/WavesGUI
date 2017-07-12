(function () {
    'use strict';

    class AccountList {

        /**
         * @constructor
         * @param $scope
         * @param dialogService
         * @param {LoginContext} loginContext
         */
        constructor($scope, dialogService, loginContext) {
            this.$scope = $scope;
            this.loginContext = loginContext;
            this.dialogService = dialogService;
            this.accounts = [];
            this.removeCandidate = {};

            loginContext.getAccounts().then((accounts) => {
                this.accounts = accounts;
            });
        }

        showRemoveWarning(index) {
            this.removeIndex = index;
            this.removeCandidate = this.accounts[index];
            this.dialogService.open('#account-remove-popup');
        }

        removeAccount() {
            if (this.removeCandidate) {
                this.loginContext.removeAccountByIndex(this.removeIndex).then(() => {
                    this.removeCandidate = undefined;
                    this.removeIndex = undefined;
                });
            }
        }

        createAccount() {
            this.loginContext.notifyGenerateSeed(this.$scope);
        }

        importAccount() {
            this.loginContext.showInputSeedScreen(this.$scope);
        }

        signIn(account) {
            this.loginContext.showLoginScreen(this.$scope, account);
        }

    }

    AccountList.$inject = ['$scope', 'dialogService', 'loginContext'];

    angular
        .module('app.login')
        .controller('accountListController', AccountList);
})();

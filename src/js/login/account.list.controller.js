(function () {
    'use strict';

    function AccountListController($scope, accountService, dialogService, loginContext) {
        var list = this;
        list.accounts = [];

        accountService.getAccounts().then(function (accounts) {
            list.accounts = accounts;
        });

        list.removeAccount = removeAccount;
        list.createAccount = createAccount;
        list.importAccount = importAccount;
        list.signIn = signIn;
        list.showRemoveWarning = showRemoveWarning;

        function showRemoveWarning(account) {
            list.removeCandidate = account;
            dialogService.open('#account-remove-popup');
        }

        function removeAccount() {
            if (list.removeCandidate) {
                accountService.removeAccount(list.removeCandidate).then(function () {
                    list.removeCandidate = undefined;
                });
            }
        }

        function createAccount() {
            loginContext.notifyGenerateSeed($scope);
        }

        function importAccount() {
            loginContext.showInputSeedScreen($scope);
        }

        function signIn(account) {
            loginContext.showLoginScreen($scope, account);
        }
    }

    AccountListController.$inject = ['$scope', 'accountService', 'dialogService', 'loginContext'];

    angular
        .module('app.login')
        .controller('accountListController', AccountListController);
})();

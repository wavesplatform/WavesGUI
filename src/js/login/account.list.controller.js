(function () {
    'use strict';

    function AccountListController($scope, events, modes, accountService, dialogService) {
        var list = this;
        list.accounts = [{
            name: 'qqq',
            address: 'lalala'
        }];
        function onLoadAccountsCallback(accounts) {
            //list.accounts = accounts;
        }

        accountService.getAccounts(onLoadAccountsCallback);

        list.removeAccount = removeAccount;
        list.createAccount = createAccount;
        list.importAccount = importAccount;
        list.signIn = signIn;

        function removeAccount(index) {
            list.accountIndex = index;
            dialogService.open('#account-remove-popup');
        }

        function createAccount() {
            $scope.$emit(events.GENERATE_SEED);
        }

        function importAccount() {
            $scope.$emit(events.CHANGE_MODE, modes.CREATE_SEED);
        }

        function signIn(account) {
            $scope.$emit(events.CHANGE_MODE, modes.LOGIN, account);
        }
    }

    AccountListController.$inject = ['$scope', 'ui.login.events', 'ui.login.modes', 'accountService', 'dialogService'];

    angular
        .module('app.login')
        .controller('accountListController', AccountListController);
})();

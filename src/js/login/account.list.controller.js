(function () {
    'use strict';

    angular
        .module('app.login')
        .controller('accountListController', [
            '$scope',
            'ui.login.events',
            'ui.login.modes',
            'accountService',
            'dialogService',
            function ($scope, events, modes, accountService, dialogService) {
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
        }]);
})();

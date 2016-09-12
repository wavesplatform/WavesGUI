(function () {
    'use strict';

    angular
        .module('app.login')
        .controller('accountListController', ['$scope', 'ui.login.events', 'ui.login.modes', 'accountService',
            function ($scope, events, modes, accountService) {
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
                angular.element('#account-remove-popup').modal();
            }

            function createAccount() {
                $scope.$emit(events.CHANGE_MODE, modes.CREATE_SEED);
            }

            function importAccount() {
                createAccount();
            }
        }]);
})();

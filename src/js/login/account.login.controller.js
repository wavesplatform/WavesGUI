(function () {
    'use strict';

    function AccountLoginController ($scope, cryptoService, loginContext, notificationService, $state) {
        var vm = this;

        vm.signIn = signIn;
        vm.cancel = cancel;

        function cleanup() {
            vm.password = '';
        }

        function performSignIn() {
            var account = loginContext.currentAccount;
            if (angular.isUndefined(account)) {
                throw new Error('Account to log in hasn\'t been selected');
            }

            var decryptedSeed = cryptoService.decryptWalletSeed(account.cipher, vm.password, account.checksum);
            if (!decryptedSeed) {
                notificationService.error('Wrong password! Please try again.');
            }
            else {
                $state.go('home');
            }
        }

        function signIn() {
            performSignIn();
            cleanup();
        }

        function cancel() {
            loginContext.showAccountsListScreen($scope);
            cleanup();
        }
    }

    AccountLoginController.$inject = [
        '$scope', 'cryptoService', 'loginContext', 'notificationService', '$state'
    ];

    angular
        .module('app.login')
        .controller('accountLoginController', AccountLoginController);
})();

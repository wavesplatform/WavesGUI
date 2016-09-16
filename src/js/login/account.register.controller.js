(function () {
    'use strict';

    function AccountRegisterController($scope, accountService, cryptoService, loginContext) {
        var vm = this;

        vm.saveAccountAndSignIn = saveAccountAndSignIn;
        vm.cancel = cancel;
        vm.seed = function (seed) {
            return arguments.length ? (loginContext.seed = seed) : loginContext.seed;
        };

        function cleanup() {
            vm.name = '';
            vm.password = '';
            vm.confirmPassword = '';
        }

        function saveAccountAndSignIn() {
            var seed = loginContext.seed;
            var cipher = cryptoService.encryptWalletSeed(seed, vm.password).toString();
            var publicKey = cryptoService.getPublicKey(seed);
            var checksum = cryptoService.seedChecksum(seed);
            var address = cryptoService.buildRawAddress(publicKey);

            var account = {
                name: vm.name,
                cipher: cipher,
                checksum: checksum,
                publicKey: publicKey,
                address: address
            };

            accountService.addAccount(account);

            loginContext.notifySignedIn($scope, address, seed);

            cleanup();
        }

        function cancel() {
            loginContext.showAccountsListScreen($scope);
            cleanup();
        }
    }

    AccountRegisterController.$inject = ['$scope', 'accountService', 'cryptoService', 'loginContext'];

    angular
        .module('app.login')
        .controller('accountRegisterController', AccountRegisterController);
})();

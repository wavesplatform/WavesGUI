(function () {
    'use strict';

    function AccountSeedController($scope, loginContext, utilityService,
                                   cryptoService, dialogService, passPhraseService) {
        var vm = this;

        vm.registerAccount = registerAccount;
        vm.back = goBack;
        vm.refreshAddress = refreshAddress;
        vm.checkSeedAndRegister = checkSeedAndRegister;
        vm.generateSeed = generateSeed;

        function cleanup() {
            //it seems we won't need this code if we switch to recreation of controllers on each event
            vm.seed = '';
            vm.displayAddress = '';
        }

        function refreshAddress() {
            var raw = cryptoService.buildRawAddressFromSeed(vm.seed);
            vm.displayAddress = loginContext.convertAddress(raw);
        }

        function checkSeedAndRegister() {
            if (utilityService.endsWithWhitespace(vm.seed)) {
                dialogService.openNonCloseable('#seed-whitespace-popup');
            }
            else {
                registerAccount();
            }
        }

        function generateSeed() {
            vm.seed = passPhraseService.generate();
            refreshAddress();
        }

        function registerAccount() {
            loginContext.showRegisterScreen($scope, vm.seed);
            cleanup();
        }

        function goBack() {
            loginContext.showAccountsListScreen($scope);
            cleanup();
        }
    }

    AccountSeedController.$inject = ['$scope',
        'loginContext',
        'utilityService',
        'cryptoService',
        'dialogService',
        'passPhraseService'];

    angular
        .module('app.login')
        .controller('accountSeedController', AccountSeedController);
})();

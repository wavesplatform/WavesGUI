(function () {
    'use strict';

    function AccountSeedController($scope, events, modes,
                                   cryptoService, addressService, utilityService, dialogService, passPhraseService) {
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
            vm.address = addressService.fromRawAddress(raw);
            vm.displayAddress = vm.address.getDisplayAddress();
        }

        function checkSeedAndRegister() {
            if (utilityService.endsWithWhitespace(vm.seed)) {
                dialogService.open('#seed-whitespace-popup');
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
            $scope.$emit(events.CHANGE_MODE, modes.REGISTER, vm.seed);
            cleanup();
        }

        function goBack() {
            $scope.$emit(events.CHANGE_MODE, modes.LIST);
            cleanup();
        }
    }

    AccountSeedController.$inject = ['$scope',
        'ui.login.events',
        'ui.login.modes',
        'cryptoService',
        'addressService',
        'utilityService',
        'dialogService',
        'passPhraseService'];

    angular
        .module('app.login')
        .controller('accountSeedController', AccountSeedController);
})();

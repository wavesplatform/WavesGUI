(function () {
    'use strict';

    angular
        .module('app.login')
        .controller('accountsController', [
            '$scope',
            'ui.login.modes',
            'ui.login.events',
            'passPhraseService',
            'dialogService',
            'cryptoService',
            'addressService',
            function ($scope, modes, events, passPhraseService, dialogService, cryptoService, addressService) {
            var accounts = this;
            accounts.seed = '';
            accounts.generatedSeed = false;

            // by default start in list mode
            switchToMode(modes.LIST);

            $scope.$on(events.CHANGE_MODE, function (event, mode, seed) {
                switchToMode(mode, seed);
            });

            $scope.$on(events.GENERATE_SEED, function (event) {
                var seed = passPhraseService.generate();
                accounts.generatedSeed = true;
                switchToMode(modes.REGISTER, seed);
                dialogService.open('#login-wPop-new');
            });

            function switchToMode(mode, seed) {
                switch (mode) {
                    case modes.REGISTER:
                        switchToRegisterMode(seed);
                        break;

                    case modes.CREATE_SEED:
                        switchToCreateSeedMode();
                        break;

                    case modes.LIST:
                        switchToListMode();
                        break;

                    default:
                        throw new Error('Unsupported account operation: ' + mode);
                }

                accounts.mode = mode;
            }

            function switchToListMode() {
                accounts.caption = 'ACCOUNTS';
            }

            function switchToCreateSeedMode() {
                accounts.caption = 'SET UP YOUR SEED';
            }

            function switchToRegisterMode(seed) {
                accounts.caption = 'REGISTER ACCOUNT';
                accounts.seed = seed;

                var raw = cryptoService.buildRawAddressFromSeed(seed);
                accounts.displayAddress = addressService.fromRawAddress(raw).getDisplayAddress();
            }
        }]);
})();

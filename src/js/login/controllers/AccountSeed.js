(function () {
    'use strict';

    const SEED_MINIMUM_LENGTH = 25;

    function AccountSeed($scope, loginContext, utilityService, cryptoService, dialogService, passPhraseService) {

        const ctrl = this;

        ctrl.validationOptions = {
            onfocusout: false,
            rules: {
                walletSeed: {
                    required: true,
                    minlength: SEED_MINIMUM_LENGTH
                }
            },
            messages: {
                walletSeed: {
                    required: `Wallet seed is required`,
                    minlength: `Wallet seed is too short. A secure wallet seed should contain more than ${
                        SEED_MINIMUM_LENGTH} characters`
                }
            }
        };
        ctrl.registerAccount = registerAccount;
        ctrl.back = goBack;
        ctrl.refreshAddress = refreshAddress;
        ctrl.checkSeedAndRegister = checkSeedAndRegister;
        ctrl.generateSeed = generateSeed;

        function cleanup() {
            // it seems we won't need this code if we switch to recreation of controllers on each event
            ctrl.seed = ``;
            ctrl.displayAddress = ``;
        }

        function refreshAddress() {
            ctrl.displayAddress = cryptoService.buildRawAddressFromSeed(ctrl.seed);
        }

        function checkSeedAndRegister(form) {
            if (!form.validate()) {
                return false;
            }

            if (utilityService.endsWithWhitespace(ctrl.seed)) {
                dialogService.openNonCloseable(`#seed-whitespace-popup`);
            } else {
                registerAccount();
            }

            return true;
        }

        function generateSeed() {
            ctrl.seed = passPhraseService.generate();
            refreshAddress();
        }

        function registerAccount() {
            loginContext.showRegisterScreen($scope, ctrl.seed);
            cleanup();
        }

        function goBack() {
            loginContext.showAccountsListScreen($scope);
            cleanup();
        }
    }

    AccountSeed.$inject = [
        `$scope`, `loginContext`, `utilityService`, `cryptoService`, `dialogService`, `passPhraseService`
    ];

    angular
        .module(`app.login`)
        .controller(`accountSeedController`, AccountSeed);
})();

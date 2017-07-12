(function () {
    'use strict';

    class Accounts {

        /**
         * @constructor
         * @param $scope
         * @param modes
         * @param events
         * @param passPhraseService
         * @param dialogService
         * @param cryptoService
         * @param {LoginContext} loginContext
         */
        constructor($scope, modes, events, passPhraseService, dialogService, cryptoService, loginContext) {

            this.cryptoService = cryptoService;

            /**
             * @type {LoginContext}
             */
            this.loginContext = loginContext;
            this.modes = modes;

            // by default start in list mode
            this.switchToMode(modes.LIST);
            this.setHandlers($scope, events, passPhraseService, dialogService);
        }

        /**
         *
         * @param $scope
         * @param events
         * @param passPhraseService
         * @param dialogService
         */
        setHandlers($scope, events, passPhraseService, dialogService) {
            $scope.$on(events.CHANGE_MODE, (event, mode, param) => {
                this.switchToMode(mode, param);
            });

            $scope.$on(events.GENERATE_SEED, () => {
                const seed = passPhraseService.generate();
                this.switchToMode(this.modes.REGISTER, seed);
                dialogService.openNonCloseable(`#login-wPop-new`);
            });
        }

        /**
         *
         * @param mode
         * @param param
         */
        switchToMode(mode, param) {
            switch (mode) {
                case this.modes.REGISTER:
                    this.switchToRegisterMode(param);
                    break;

                case this.modes.CREATE_SEED:
                    this.switchToCreateSeedMode();
                    break;

                case this.modes.LIST:
                    this.switchToListMode();
                    break;

                case this.modes.LOGIN:
                    this.switchToLoginMode(param);
                    break;

                default:
                    throw new Error(`Unsupported account operation: ${mode}`);
            }

            this.mode = mode;
        }

        switchToListMode() {
            this.caption = `ACCOUNTS`;
        }

        switchToCreateSeedMode() {
            this.caption = `SET UP YOUR SEED`;
        }

        switchToRegisterMode(seed) {
            this.caption = `REGISTER ACCOUNT`;
            this.displayAddress = this.cryptoService.buildRawAddressFromSeed(seed);
            // setting a seed to register a new account
            this.loginContext.seed = seed;
        }

        switchToLoginMode(account) {
            this.caption = `SIGN IN`;
            this.displayAddress = account.address;
            // setting an account which we would like to sign in
            this.loginContext.currentAccount = account;
        }

    }

    Accounts.$inject = [
        `$scope`,
        `ui.login.modes`,
        `ui.login.events`,
        `passPhraseService`,
        `dialogService`,
        `cryptoService`,
        `loginContext`
    ];

    angular
        .module(`app.login`)
        .controller(`accountsController`, Accounts);
})();

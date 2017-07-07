(function () {
    'use strict';

    const SCREENS = {
        splash: 'splash-screen',
        accounts: 'accounts-screen',
        main: 'main-screen'
    };

    class HomeController extends BaseClass {

        constructor() {
            super(...arguments);

            this.initialize();
        }

        initialize() {
            const titlePrefix = this.deps.utilsService.isTestnet() ? 'TESTNET ' : '';

            this.isTestnet = this.deps.utilsService.isTestnet;
            this.screen = SCREENS.splash;

            this.title = titlePrefix + 'Lite Client';
            this.version = this.deps.applicationConstants.CLIENT_VERSION;
        }

        setHandlers() {
            super.setHandlers();

            this.$on(this.deps.events.SPLASH_COMPLETED, () => {
                this.screen = SCREENS.accounts;
            });
        }

        clipboardOk(message) {
            message = message || 'Address copied successfully';
            this.deps.notificationService.notice(message);
        }

        featureUnderDevelopment() {
            this.deps.dialogService.open('#feat-not-active');
        }

        logout() {
            const window = this.deps.$window;
            if (window.chrome && window.chrome.runtime && typeof window.chrome.runtime.reload === 'function') {
                window.chrome.runtime.reload();
            } else {
                window.location.reload();
            }
        }

        static $inject = [
            '$window', 'ui.events', 'constants.application', 'utilsService',
            'dialogService', 'applicationContext', 'notificationService', 'apiService'
        ];

    }

    // $scope.$on(events.LOGIN_SUCCESSFUL, function (event, account) {
    //     // putting the current account to the app context
    //     applicationContext.account = account;
    //
    //     apiService.assets.balance(applicationContext.account.address)
    //         .then(function (response) {
    //             _.forEach(response.balances, function (balanceItem) {
    //                 applicationContext.cache.putAsset(balanceItem.issueTransaction);
    //             });
    //         })
    //         .finally(function () {
    //             ctrl.screen = SCREENS.main;
    //         });
    // });

    angular
        .module('app.ui')
        .controller('homeController', HomeController);
})();

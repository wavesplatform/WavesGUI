(function () {
    'use strict';

    const SCREENS = {
        splash: 'splash-screen',
        accounts: 'accounts-screen',
        main: 'main-screen'
    };

    class HomeController {

        constructor($scope, $timeout, $window, events, applicationConstants, utilsService, dialogService, notificationService) {

            this.$window = $window;
            this.dialogService = dialogService;
            this.notificationService = notificationService;

            this.initialize(applicationConstants, utilsService, $timeout, $scope);
            this.setHandlers($scope, events);
        }

        initialize(applicationConstants, utilsService, $timeout, $scope) {
            const titlePrefix = utilsService.isTestnet() ? 'TESTNET ' : '';

            $scope.isTestnet = utilsService.isTestnet;
            $scope.clipboardOk = this.clipboardOk.bind(this);
            this.loading = true;

            this.title = titlePrefix + 'Lite Client';
            this.version = applicationConstants.CLIENT_VERSION;

            $timeout(() => {
                this.loading = false;
            }, 1);
        }

        setHandlers($scope, events) {

            $scope.$on(events.SPLASH_COMPLETED, () => {
                this.screen = SCREENS.accounts;
            });

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

        }

        clipboardOk(message) {
            message = message || 'Address copied successfully';
            this.notificationService.notice(message);
        }

        featureUnderDevelopment() {
            this.dialogService.open('#feat-not-active');
        }

        logout() {
            const window = this.$window;
            if (window.chrome && window.chrome.runtime && typeof window.chrome.runtime.reload === 'function') {
                window.chrome.runtime.reload();
            } else {
                window.location.reload();
            }
        }

    }

    HomeController.$inject = [
        '$scope', '$timeout', '$window', 'ui.events', 'constants.application', 'utilsService',
        'dialogService', 'notificationService'
    ];

    angular
        .module('app.ui')
        .controller('homeController', HomeController);
})();

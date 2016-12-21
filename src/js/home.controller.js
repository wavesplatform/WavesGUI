(function () {
    'use strict';

    var SCREENS = {
        splash: 'splash-screen',
        accounts: 'accounts-screen',
        main: 'main-screen'
    };

    function HomeController($scope, $window, events, networkConstants, applicationConstants,
                            dialogService, applicationContext, notificationService, apiService) {
        function isTestnet() {
            return networkConstants.NETWORK_NAME === 'devel';
        }

        $scope.isTestnet = isTestnet;

        var home = this;
        home.screen = SCREENS.splash;
        home.featureUnderDevelopment = featureUnderDevelopment;
        home.logout = logout;

        var titlePrefix = isTestnet() ? 'TESTNET ' : '';
        home.title = titlePrefix + 'Lite Client';
        home.version = applicationConstants.CLIENT_VERSION;

        $scope.$on(events.SPLASH_COMPLETED, function () {
            home.screen = SCREENS.accounts;
        });

        $scope.clipboardOk = function (message) {
            message = message || 'Address copied successfully';
            notificationService.notice(message);
        };

        $scope.$on(events.LOGIN_SUCCESSFUL, function (event, account) {
            // putting the current account to the app context
            applicationContext.account = account;

            NProgress.start();
            apiService.assets.balance(applicationContext.account.address)
                .then(function (response) {
                    _.forEach(response.balances, function (balanceItem) {
                        applicationContext.cache.assets.put(balanceItem.issueTransaction);
                    });
                })
                .finally(function () {
                    home.screen = SCREENS.main;
                    NProgress.done();
                });
        });

        function featureUnderDevelopment() {
            dialogService.open('#feat-not-active');
        }

        function logout() {
            if ($window.chrome && $window.chrome.extension)
                $window.chrome.runtime.reload();
            else
                $window.location.reload();
        }
    }

    HomeController.$inject = ['$scope', '$window', 'ui.events', 'constants.network', 'constants.application',
        'dialogService', 'applicationContext', 'notificationService', 'apiService'];

    angular
        .module('app.ui')
        .controller('homeController', HomeController);
})();

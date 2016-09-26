(function () {
    'use strict';

    function HomeController($scope, $window, events, constants, dialogService, applicationContext) {
        function isTestnet() {
            return constants.NETWORK_NAME === 'devel';
        }

        var home = this;
        home.splashVisible = true;
        home.accountsVisible = true;
        home.mainViewVisible = false;
        home.isTestnet = isTestnet;
        home.featureUnderDevelopment = featureUnderDevelopment;
        home.logout = logout;

        var titlePrefix = isTestnet() ? 'TESTNET ' : '';
        home.title = titlePrefix + 'Lite Client';
        home.version = constants.CLIENT_VERSION;

        $scope.$on(events.SPLASH_COMPLETED, function () {
            home.splashVisible = false;
            home.accountsVisible = true;

            //todo: add fade animation on splash close
        });

        $scope.$on(events.LOGIN_SUCCESSFUL, function (event, account) {
            // putting the current account to the app context
            applicationContext.account = account;
            home.accountsVisible = false;
            home.mainViewVisible = true;
        });

        function featureUnderDevelopment() {
            dialogService.open('#feat-not-active');
        }

        function logout() {
            $window.location.reload();
        }
    }

    HomeController.$inject = ['$scope', '$window', 'ui.events', 'constants.core',
        'dialogService', 'applicationContext'];

    angular
        .module('app')
        .controller('homeController', HomeController);
})();

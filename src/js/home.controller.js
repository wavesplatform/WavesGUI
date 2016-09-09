(function () {
    'use strict';

    angular
        .module('app')
        .controller('homeController', ['$scope', 'ui.events', 'constants.core', function ($scope, events, constants) {
            function isTestnet() {
                return constants.NETWORK_NAME === 'devel';
            }

            var home = this;
            home.splashVisible = true;
            home.accountsVisible = true;
            home.mainViewVisible = false;
            home.isTestnet = isTestnet;

            var titlePrefix = isTestnet() ? 'TESTNET ' : '';
            home.title = titlePrefix + 'Lite Client';
            home.version = constants.CLIENT_VERSION;

            $scope.$on(events.SPLASH_COMPLETED, function () {
                home.splashVisible = false;
                home.accountsVisible = true;

                //todo: add fade animation on splash close
            });

            $scope.$on(events.LOGIN_SUCCESSFUL, function (account) {
                home.account = account;
                home.accountsVisible = false;
                home.mainViewVisible = true;
            });
        }]);
})();

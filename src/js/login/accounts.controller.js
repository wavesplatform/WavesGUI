(function () {
    'use strict';

    angular
        .module('app.login')
        .controller('accountsController',
            ['$scope', 'ui.login.modes', 'ui.login.events', function ($scope, modes, events) {
            var accounts = this;

            // by default start in list mode
            switchToMode(modes.LIST);

            $scope.$on(events.CHANGE_MODE, function (event, mode) {
                switchToMode(mode);
            });

            function switchToMode(mode) {
                switch (mode) {
                    case modes.REGISTER:
                        switchToRegisterMode();
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

            function switchToRegisterMode() {
                accounts.caption = 'REGISTER ACCOUNT';
            }
        }]);
})();

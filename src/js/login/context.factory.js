(function () {
    'use strict';

    function LoginContextFactory(moduleEvents, applicationEvents, modes, applicationContext, apiService, $state) {
        return {
            showAccountsListScreen: function ($scope) {
                $scope.$emit(moduleEvents.CHANGE_MODE, modes.LIST);
            },

            showInputSeedScreen: function ($scope) {
                $scope.$emit(moduleEvents.CHANGE_MODE, modes.CREATE_SEED);
            },

            showLoginScreen: function ($scope, account) {
                $scope.$emit(moduleEvents.CHANGE_MODE, modes.LOGIN, account);
            },

            showRegisterScreen: function ($scope, seed) {
                $scope.$emit(moduleEvents.CHANGE_MODE, modes.REGISTER, seed);
            },

            notifyGenerateSeed: function ($scope) {
                $scope.$emit(moduleEvents.GENERATE_SEED);
            },

            notifySignedIn: function ($scope, rawAddress, seed, keys) {
                const applicationState = {
                    address: rawAddress,
                    seed: seed,
                    keyPair: keys
                };

                applicationContext.account = applicationState;
                apiService.assets.balance(applicationContext.account.address)
                    .then(function (response) {
                        _.forEach(response.balances, function (balanceItem) {
                            applicationContext.cache.putAsset(balanceItem.issueTransaction);
                        });
                    });

                $state.go('home.wallet');
            }
            // notifySignedIn: function ($scope, rawAddress, seed, keys) {
            //     var applicationState = {
            //         address: rawAddress,
            //         seed: seed,
            //         keyPair: keys
            //     };
            //
            //     $scope.$emit(applicationEvents.LOGIN_SUCCESSFUL, applicationState);
            // }
        };
    }

    LoginContextFactory.$inject = [
        'ui.login.events', 'ui.events', 'ui.login.modes', 'applicationContext', 'apiService', '$state'
    ];

    angular
        .module('app.login')
        .factory('loginContext', LoginContextFactory);
})();

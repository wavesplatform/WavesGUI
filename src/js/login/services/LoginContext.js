(function () {
    'use strict';

    function loginContextFactory(moduleEvents, modes, applicationContext, apiService, $state, accountService) {

        class LoginContext {

            /**
             * @constructor
             */
            constructor() {
                /**
                 * @type {string}
                 */
                this.seed = null;
                /**
                 * @type {*}
                 */
                this.currentAccount = null;
            }

            /**
             * @returns {Promise}
             */
            getAccounts() {
                return accountService.getAccounts();
            }

            /**
             *
             * @param index
             * @returns {*}
             */
            removeAccountByIndex(index) {
                return accountService.removeAccountByIndex(index);
            }

            /**
             *
             * @param account
             */
            addAccount(account) {
                accountService.addAccount(account);
            }

            /**
             *
             * @param rawAddress
             * @param seed
             * @param keys
             */
            notifySignedIn(rawAddress, seed, keys) {
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

            /**
             * @param $scope
             */
            showAccountsListScreen($scope) {
                $scope.$emit(moduleEvents.CHANGE_MODE, modes.LIST);
            }

            /**
             * @param $scope
             */
            showInputSeedScreen($scope) {
                $scope.$emit(moduleEvents.CHANGE_MODE, modes.CREATE_SEED);
            }

            /**
             * @param $scope
             * @param account
             */
            showLoginScreen($scope, account) {
                $scope.$emit(moduleEvents.CHANGE_MODE, modes.LOGIN, account);
            }

            /**
             * @param $scope
             * @param seed
             */
            showRegisterScreen($scope, seed) {
                $scope.$emit(moduleEvents.CHANGE_MODE, modes.REGISTER, seed);
            }

            /**
             * @param $scope
             */
            notifyGenerateSeed($scope) {
                $scope.$emit(moduleEvents.GENERATE_SEED);
            }

        }

        return new LoginContext();
    }

    loginContextFactory.$inject = [
        'ui.login.events', 'ui.login.modes', 'applicationContext', 'apiService', '$state', 'accountService'
    ];

    angular
        .module('app.login')
        .factory('loginContext', loginContextFactory);
})();

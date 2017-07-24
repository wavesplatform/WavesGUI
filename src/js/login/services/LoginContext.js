(function () {
    'use strict';

    function loginContextFactory(moduleEvents, modes, applicationContext, apiService, $state, accountService, $q,
                                 $rootScope, $location) {

        class LoginContext {

            /**
             * @constructor
             */
            constructor() {

                /**
                 * @private
                 */
                this._loginPromise = $q.defer();

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
            login() {
                const base = $location.absUrl().replace($location.path(), ``);
                $location.path(`/login`).replace();
                const stop = $rootScope.$on(`$locationChangeStart`, (event, next) => {
                    if (next.replace(base, ``) !== `/login`) {
                        event.preventDefault();
                    }
                });
                return this._loginPromise.promise.then(() => {
                    stop();
                });
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
                    .then((response) => {
                        _.forEach(response.balances, (balanceItem) => {
                            applicationContext.cache.putAsset(balanceItem.issueTransaction);
                        });
                        this._loginPromise.resolve();
                    });
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
        `ui.login.events`, `ui.login.modes`, `applicationContext`, `apiService`, `$state`, `accountService`, `$q`,
        `$rootScope`, `$location`
    ];

    angular
        .module(`app.login`)
        .factory(`loginContext`, loginContextFactory);
})();

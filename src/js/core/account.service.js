(function() {
    'use strict';

    angular
        .module('app.core.services')
        .service('accountService', ['storageService', function(storageService) {
            this.addAccount = function (accountInfo, onDataUpdatedCallback) {
                storageService.loadState(function (state) {
                    state = state || {};
                    if (!state.accounts)
                        state.accounts = [];

                    state.accounts.push(accountInfo);
                    storageService.saveState(state, onDataUpdatedCallback);
                });
            };

            this.removeAccount = function (accountIndex, onAccountRemovedCallback) {
                storageService.loadState(function (state) {
                    state.accounts.splice(accountIndex, 1);

                    storageService.saveState(state, onAccountRemovedCallback);
                });
            };

            this.getAccounts = function (onAccountsLoadedCallback) {
                storageService.loadState(function (state) {
                    onAccountsLoadedCallback(state.accounts);
                });
            };
        }]);
})();

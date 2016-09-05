(function() {
    'use strict';

    angular
        .module('app.core.services')
        .service('chromeStorageService', [function() {
            var $key = 'WavesAccounts';

            this.saveState = function(state, onSuccessCallback) {
                var json = {};
                json[$key] = state;

                chrome.storage.sync.set(json, onSuccessCallback);
            };

            this.loadState = function(onDataReadCallback) {
                chrome.storage.sync.get($key, function(data) {
                    onDataReadCallback(data[$key]);
                });
            };
        }]);
})();

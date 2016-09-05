(function() {
    'use strict';

    angular
        .module('app.core.services')
        .service('html5StorageService', ['constants.core', '$window', function(constants, window) {
            if (angular.isUndefined(constants.NETWORK_NAME))
                throw new Error('Network name hasn\'t been configured');

            var $key = 'Waves' + constants.NETWORK_NAME;

            this.saveState = function(state, onSuccessCallback) {
                var serialized = angular.toJson(state);

                window.localStorage.setItem($key, serialized);
                if (onSuccessCallback) {
                    onSuccessCallback();
                }
            };

            this.loadState = function(onDataReadCallback) {
                if (!onDataReadCallback)
                    return;

                var data;
                var serialized = window.localStorage.getItem($key);

                if (serialized) {
                    data = angular.fromJson(serialized);
                }

                onDataReadCallback(data);
            };

            this.clear = function(onClearedCallback) {
                window.localStorage.removeItem($key);
                onClearedCallback();
            };
        }]);
})();

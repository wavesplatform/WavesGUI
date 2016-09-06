(function() {
    'use strict';

    angular.module('app.core.services', ['app.core', 'restangular'])
        .run(['Restangular', 'constants.core', function(rest, constants) {
            rest.setBaseUrl(constants.NODE_ADDRESS);

            // debugging requests
            if (constants.NETWORK_NAME !== 'mainnet')
                rest.addRequestInterceptor(function (element, operation, what, url) {
                    console.log(url);
                });
        }]);
})();

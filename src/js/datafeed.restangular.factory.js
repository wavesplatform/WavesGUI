(function () {
    'use strict';

    function DatafeedRestangularFactory(constants, rest) {
        return rest.withConfig(function(configurer) {
            configurer.setBaseUrl(constants.DATAFEED_ADDRESS);
        });
    }

    DatafeedRestangularFactory.$inject = ['constants.application', 'Restangular'];

    angular
        .module('app.ui')
        .factory('DatafeedRestangular', DatafeedRestangularFactory);
})();

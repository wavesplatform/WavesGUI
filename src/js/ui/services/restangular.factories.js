(function () {
    'use strict';

    function CoinomatRestangularFactory(constants, rest) {
        return rest.withConfig(function(configurer) {
            configurer.setBaseUrl(constants.COINOMAT_ADDRESS);
        });
    }

    function DatafeedRestangularFactory(constants, rest) {
        return rest.withConfig(function(configurer) {
            configurer.setBaseUrl(constants.DATAFEED_ADDRESS);
        });
    }

    function MatcherRestangularFactory(constants, rest) {
        return rest.withConfig(function(configurer) {
            configurer.setBaseUrl(constants.MATCHER_ADDRESS);
        });
    }

    CoinomatRestangularFactory.$inject = ['constants.application', 'Restangular'];
    DatafeedRestangularFactory.$inject = ['constants.application', 'Restangular'];
    MatcherRestangularFactory.$inject = ['constants.application', 'Restangular'];

    angular
        .module('app.ui')
        .factory('CoinomatRestangular', CoinomatRestangularFactory)
        .factory('DatafeedRestangular', DatafeedRestangularFactory)
        .factory('MatcherRestangular', MatcherRestangularFactory);
})();

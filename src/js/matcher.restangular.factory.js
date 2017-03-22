(function () {
    'use strict';

    function MatcherRestangularFactory(constants, rest) {
        return rest.withConfig(function(configurer) {
            configurer.setBaseUrl(constants.MATCHER_ADDRESS);
        });
    }

    MatcherRestangularFactory.$inject = ['constants.application', 'Restangular'];

    angular
        .module('app.ui')
        .factory('MatcherRestangular', MatcherRestangularFactory);
})();

(function () {
    'use strict';

    angular
        .module('app.state')
        .service('stateService', ['stateFactory', function (stateFactory) {
            var state = stateFactory.create();

            this.getState = function () {
                return state;
            };
        }]);
})();

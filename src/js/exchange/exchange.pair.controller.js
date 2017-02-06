(function () {
    'use strict';

    function WavesExchangePairController ($scope, events, matcherService) {
        var pair = this;

        pair.notFound = false;

        $scope.$on(events.EXCHANGE_SHOW_PAIR_MARKET, function (event, eventData) {
            //TODO: get order book for a pair or show message that there is no such a pair
        });
    }

    WavesExchangePairController.$inject = ['$scope', 'exchange.events', 'matcherService'];

    angular
        .module('app.exchange')
        .controller('exchangePairController', WavesExchangePairController);
})();

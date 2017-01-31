(function () {
    'use strict';

    function WavesExchangePairNewController ($scope, events, dialogService) {
        var newPair = this;

        newPair.showPairMarket = showPairMarket;

        function showPairMarket () {
            $scope.$emit(events.EXCHANGE_SHOW_PAIR_MARKET, {
                //TODO: add asset identifiers
            });
        }

        $scope.$on(events.EXCHANGE_OPEN_NEW_PAIR, function (event, eventData) {
            dialogService.open('#exchange-pair-new-dialog');
        });
    }

    WavesExchangePairNewController.$inject = ['$scope', 'exchange.events', 'dialogService'];

    angular
        .module('app.exchange')
        .controller('exchangePairNewController', WavesExchangePairNewController);
})();

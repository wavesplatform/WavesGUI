(function () {
    'use strict';

    var LIST_PAGE_NAME = 'list';
    var PAIR_PAGE_NAME = 'pair';

    function WavesExchangeMainController ($scope, events) {
        var exchangeMain = this;

        exchangeMain.page = 'list';
        exchangeMain.showListPage = showListPage;
        exchangeMain.showPairPage = showPairPage;
        exchangeMain.showNewPairDialog = showNewPairDialog;

        function showListPage () {
            exchangeMain.page = LIST_PAGE_NAME;
        }

        function showPairPage () {
            exchangeMain.page = PAIR_PAGE_NAME;
        }

        function showNewPairDialog () {
            $scope.$broadcast(events.EXCHANGE_OPEN_NEW_PAIR, {});
        }

        $scope.$on(events.EXCHANGE_SHOW_PAIR_MARKET, function (event, eventData) {
            //TODO: pass asset pair as a parameter
            exchangeMain.showPairPage();
        });
    }

    WavesExchangeMainController.$inject = ['$scope', 'exchange.events'];

    angular
        .module('app.exchange')
        .controller('exchangeMainController', WavesExchangeMainController);
})();

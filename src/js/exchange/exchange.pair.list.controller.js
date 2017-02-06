(function () {
    'use strict';

    function WavesExchangePairListController ($scope, $interval, $timeout, matcherService, notificationService) {
        var pairList = this;
        var refreshPromise;
        var refreshDelay = 60 * 1000; // refreshing every minute
        pairList.noData = true;
        pairList.pairs = [];
        pairList.search = '';
        pairList.searchPredicate = searchPredicate;
        pairList.clearSearch = clearSearch;

        loadDataFromBackend();

        $scope.$on('$destroy', function () {
            if (angular.isDefined(refreshPromise)) {
                $interval.cancel(refreshPromise);
                refreshPromise = undefined;
            }
        });

        function loadDataFromBackend () {
            refreshMarkets();

            refreshPromise = $interval(function() {
                refreshMarkets();
            }, refreshDelay);
        }

        function refreshMarkets () {
            matcherService.loadAllMarkets()
                .then(function (pairs) {
                    var delay = 1;
                    // handling the situation when some market appeared in matcher
                    if (pairList.pairs.length === 0 && pairs.length > 0) {
                        pairList.noData = false;
                        delay = 500; // waiting for 0.5 sec on first data loading attempt
                    }

                    // handling the situation when all market were removed from matcher
                    if (pairList.pairs.length > 0 && pairs.length === 0) {
                        pairList.noData = true;
                        delay = 500;
                    }

                    // to prevent no data message and market list from displaying simultaneously
                    // we need to update
                    $timeout(function() {
                        pairList.pairs = pairs;
                    }, delay);
                })
                .catch(function (response) {
                    //TODO: add error handling
                    notificationService.error(JSON.stringify(response));
                });
        }

        function searchPredicate (value, index, array) {
            if (!pairList.search)
                return true;

            var filter = pairList.search.toLowerCase();

            return value.first.name.toLowerCase().indexOf(filter) >= 0 ||
                value.second.name.toLowerCase().indexOf(filter) >= 0;
        }

        function clearSearch() {
            pairList.search = '';
        }
    }

    WavesExchangePairListController.$inject = ['$scope', '$interval', '$timeout',
        'matcherService', 'notificationService'];

    angular
        .module('app.exchange')
        .controller('exchangePairListController', WavesExchangePairListController);
})();

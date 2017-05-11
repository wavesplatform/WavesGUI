(function () {
    'use strict';

    var TRADES_LIMIT = 50;

    function HistoryController($interval, datafeedApiService, utilsService) {
        var ctrl = this;

        ctrl.$onChanges = function (changes) {
            if (changes.pair) {
                refreshHistory();
            }
        };

        $interval(refreshHistory, 5000);

        function refreshHistory() {
            var pair = ctrl.pair;
            if (pair) {
                if (utilsService.isTestnet()) {
                    pair = utilsService.testnetSubstitutePair(pair);
                }

                datafeedApiService
                    .getTrades(pair, TRADES_LIMIT)
                    .then(function (response) {
                        ctrl.trades = response.map(function (trade) {
                            return {
                                timestamp: trade.timestamp,
                                type: trade.type,
                                typeTitle: trade.type === 'buy' ? 'Buy' : 'Sell',
                                price: trade.price,
                                amount: trade.amount,
                                total: trade.price * trade.amount
                            };
                        });
                    });
            }
        }
    }

    HistoryController.$inject = ['$interval', 'datafeedApiService', 'utilsService'];

    angular
        .module('app.dex')
        .component('wavesDexHistory', {
            controller: HistoryController,
            bindings: {
                pair: '<'
            },
            templateUrl: 'dex/history.component'
        });
})();

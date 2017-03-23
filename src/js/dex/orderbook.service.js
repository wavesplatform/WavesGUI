(function () {
    'use strict';

    function DexOrderbookService(matcherApiService) {
        this.switchToPair = function (assetOne, assetTwo) {
            return matcherApiService
                .loadOrderBook(assetOne.id, assetTwo.id)
                .then(function (orderbook) {
                    console.log(orderbook);
                });
        };
    }

    DexOrderbookService.$inject = ['matcherApiService'];

    angular
        .module('app.dex')
        .service('dexOrderbookService', DexOrderbookService);
})();

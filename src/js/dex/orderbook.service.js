(function () {
    'use strict';

    function normalizeOrder(order, amountAsset) {
        return {
            price: Money.fromCoins(order.price, Currency.MATCHER_CURRENCY).toTokens(),
            amount: Money.fromCoins(order.amount, amountAsset).toTokens()
        };
    }

    function DexOrderbookService(matcherApiService) {
        this.getOrderbook = function (assetOne, assetTwo) {
            var assets = {};
            assets[assetOne.id] = assetOne;
            assets[assetTwo.id] = assetTwo;
            return matcherApiService
                .loadOrderbook(assetOne.id, assetTwo.id)
                .then(function (orderbook) {
                    var amountAsset = assets[orderbook.pair.amountAsset];
                    return {
                        timestamp: orderbook.timestamp,
                        pair: orderbook.pair,
                        bids: orderbook.bids.map(function (order) {
                            return normalizeOrder(order, amountAsset);
                        }),
                        asks: orderbook.asks.map(function (order) {
                            return normalizeOrder(order, amountAsset);
                        })
                    };
                });
        };
    }

    DexOrderbookService.$inject = ['matcherApiService'];

    angular
        .module('app.dex')
        .service('dexOrderbookService', DexOrderbookService);
})();

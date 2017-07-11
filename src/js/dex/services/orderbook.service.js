(function () {
    'use strict';

    function normalizeOrder(order, pair) {
        return {
            price: OrderPrice.fromBackendPrice(order.price, pair).toTokens(),
            amount: Money.fromCoins(order.amount, pair.amountAsset).toTokens()
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
                    var pair = {
                        amountAsset: assets[orderbook.pair.amountAsset],
                        priceAsset: assets[orderbook.pair.priceAsset]
                    };

                    return {
                        timestamp: orderbook.timestamp,
                        pair: orderbook.pair,
                        bids: orderbook.bids.map(function (order) {
                            return normalizeOrder(order, pair);
                        }),
                        asks: orderbook.asks.map(function (order) {
                            return normalizeOrder(order, pair);
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

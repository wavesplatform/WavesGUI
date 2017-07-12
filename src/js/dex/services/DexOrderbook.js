(function () {
    'use strict';

    function normalizeOrder(order, pair) {
        return {
            price: OrderPrice.fromBackendPrice(order.price, pair).toTokens(),
            amount: Money.fromCoins(order.amount, pair.amountAsset).toTokens()
        };
    }

    function DexOrderbook(matcherApiService) {
        this.getOrderbook = function (assetOne, assetTwo) {
            const assets = {};
            assets[assetOne.id] = assetOne;
            assets[assetTwo.id] = assetTwo;
            return matcherApiService
                .loadOrderbook(assetOne.id, assetTwo.id)
                .then((orderbook) => {
                    const pair = {
                        amountAsset: assets[orderbook.pair.amountAsset],
                        priceAsset: assets[orderbook.pair.priceAsset]
                    };

                    return {
                        timestamp: orderbook.timestamp,
                        pair: orderbook.pair,
                        bids: orderbook.bids.map((order) => normalizeOrder(order, pair)),
                        asks: orderbook.asks.map((order) => normalizeOrder(order, pair))
                    };
                });
        };
    }

    DexOrderbook.$inject = [`matcherApiService`];

    angular
        .module(`app.dex`)
        .service(`dexOrderbookService`, DexOrderbook);
})();

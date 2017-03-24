(function () {
    'use strict';

    function normalizeOrder(order, priceDecimals, amountDecimals) {
        return {
            price: order.price / Math.pow(10, priceDecimals),
            amount: order.amount / Math.pow(10, amountDecimals)
        };
    }

    function DexOrderbookService(matcherApiService) {
        this.switchToPair = function (assetOne, assetTwo) {
            var decimals = {};
            decimals[assetOne.id] = assetOne.precision;
            decimals[assetTwo.id] = assetTwo.precision;
            return matcherApiService
                .loadOrderbook(assetOne.id, assetTwo.id)
                .then(function (orderbook) {
                    var priceDecimals = decimals[orderbook.pair.priceAsset || undefined],
                        amountDecimals = decimals[orderbook.pair.amountAsset || undefined];
                    return {
                        timestamp: orderbook.timestamp,
                        pair: orderbook.pair,
                        bids: orderbook.bids.map(function (order) {
                            return normalizeOrder(order, priceDecimals, amountDecimals);
                        }),
                        asks: orderbook.asks.map(function (order) {
                            return normalizeOrder(order, priceDecimals, amountDecimals);
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

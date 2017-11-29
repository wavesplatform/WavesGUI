(function () {
    'use strict';

    const factory = function (utils) {

        class Matcher {

            getOrders(keyPair) {
                return Waves.API.Matcher.v1.getAllOrders(keyPair)
                    .then((list) => list.map(Matcher._remapOrder))
                    .then(utils.whenAll);
            }

            getOrdersByPair(assetId1, assetId2, keyPair) {
                return Waves.API.Matcher.v1.getOrders(assetId1, assetId2, keyPair)
                    .then((list) => list.map(Matcher._remapOrder))
                    .then(utils.whenAll);
            }

            cancelOrder(amountAssetId, priceAssetId, orderId, keyPair) {
                return Waves.API.Matcher.v1.cancelOrder(amountAssetId, priceAssetId, orderId, keyPair)
                    .then((res) => {
                        console.log(res);
                    });
            }

            static _remapOrder(order) {
                const priceAssetId = Matcher._getAssetId(order.assetPair.priceAsset);
                const amountAssetId = Matcher._getAssetId(order.assetPair.amountAsset);

                return Waves.AssetPair.get(priceAssetId, amountAssetId)
                    .then((assetPair) => Promise.all([
                        Waves.OrderPrice.fromMatcherCoins(String(order.amount), assetPair)
                            .then((orderPrice) => Waves.Money.fromTokens(orderPrice.getTokens(), priceAssetId)),
                        Waves.Money.fromCoins(String(order.amount), amountAssetId),
                        Waves.Money.fromCoins(String(order.filled), amountAssetId),
                        Promise.resolve(`${assetPair.priceAsset.name} / ${assetPair.amountAsset.name}`)
                    ]))
                    .then(([price, amount, filled, pair]) => {
                        const STATUS_MAP = {
                            'Cancelled': 'Cancelled',
                            'Accepted': 'Active'
                        };
                        const percent = filled.getTokens().div(amount.getTokens());
                        const state = filled.getTokens().eq(0) ? STATUS_MAP[order.status] : order.amount === order.filled ? 'Closed' : 'Filled';
                        return { ...order, price, amount, filled, pair, percent, state };
                    });
            }

            static _getAssetId(id) {
                return id || WavesApp.defaultAssets.WAVES;
            }

        }

        return new Matcher();
    };

    factory.$inject = ['utils'];

    angular.module('app').factory('matcher', factory);
})();

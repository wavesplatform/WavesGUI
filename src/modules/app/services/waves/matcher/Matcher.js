(function () {
    'use strict';

    /**
     * @param {app.utils} utils
     * @param {app.utils.decorators} decorators
     * @return {Matcher}
     */
    const factory = function (utils, decorators) {

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

            createOrder(orderData, keyPair) {
                return Waves.API.Matcher.v1.getMatcherKey().then((matcherPublicKey) => {
                    return Waves.API.Matcher.v1.createOrder({
                        matcherPublicKey,
                        ...orderData
                    }, keyPair);
                });
            }

            @decorators.cachable(1)
            getOrderBook(asset1, asset2) {
                return Waves.AssetPair.get(asset1, asset2)
                    .then((pair) => Waves.API.Matcher.v1.getOrderbook(pair.amountAsset.id, pair.priceAsset.id)
                        .then((orderBook) => Matcher._remapOrderBook(orderBook, pair))
                        .then(([bids, asks]) => ({ bids, asks, pair, spread: Matcher._getSpread(bids, asks, pair) }))
                    );
            }

            cancelOrder(amountAssetId, priceAssetId, orderId, keyPair) {
                return Waves.API.Matcher.v1.cancelOrder(amountAssetId, priceAssetId, orderId, keyPair);
            }

            static _remapOrderBook({ bids, asks }, pair) {
                return Promise.all([
                    Matcher._remapBidAsks(bids, pair),
                    Matcher._remapBidAsks(asks, pair)
                ]);
            }

            static _remapBidAsks(list, pair) {
                return Promise.all((list || [])
                    .map((item) => Promise.all([
                        Waves.Money.fromCoins(String(item.amount), pair.amountAsset)
                            .then((amount) => amount.getTokens()),
                        Waves.OrderPrice.fromMatcherCoins(String(item.price), pair)
                            .then((orderPrice) => orderPrice.getTokens())
                    ])
                        .then((amountPrice) => {
                            const amount = amountPrice[0];
                            const price = amountPrice[1];
                            const total = amount.mul(price);
                            return {
                                amount: amount.toFixed(pair.amountAsset.precision),
                                price: price.toFixed(pair.priceAsset.precision),
                                total: total.toFixed(pair.priceAsset.precision)
                            };
                        })));
            }

            static _remapOrder(order) {
                const priceAssetId = Matcher._getAssetId(order.assetPair.priceAsset);
                const amountAssetId = Matcher._getAssetId(order.assetPair.amountAsset);

                return Waves.AssetPair.get(priceAssetId, amountAssetId)
                    .then((assetPair) => Promise.all([
                        Waves.OrderPrice.fromMatcherCoins(String(order.price), assetPair)
                            .then((orderPrice) => Waves.Money.fromTokens(orderPrice.getTokens(), priceAssetId)),
                        Waves.Money.fromCoins(String(order.amount), amountAssetId),
                        Waves.Money.fromCoins(String(order.filled), amountAssetId),
                        Promise.resolve(`${assetPair.priceAsset.name} / ${assetPair.amountAsset.name}`)
                    ]))
                    .then(([price, amount, filled, pair]) => {
                        const STATUS_MAP = {
                            'Cancelled': 'Canceled',
                            'Accepted': 'Active'
                        };
                        const percent = filled.getTokens().div(amount.getTokens());
                        const state = filled.getTokens().eq(0) ? STATUS_MAP[order.status] : order.amount === order.filled ? 'Closed' : 'Filled';
                        return { ...order, price, amount, filled, pair, percent, state };
                    });
            }

            /**
             * @param {Array} bids
             * @param {Array} asks
             * @param {AssetPair} pair
             * @returns {{amount: string, price: string, total: string}}
             * @private
             */
            static _getSpread(bids, asks, pair) {
                const [lastAsk] = asks;
                const [firstBid] = bids;

                return firstBid && lastAsk && {
                    amount: lastAsk.price,
                    price: new BigNumber(lastAsk.price).sub(firstBid.price)
                        .abs()
                        .toFormat(pair.priceAsset.precision),
                    total: firstBid.price
                } || { amount: '0', price: '0', total: '0' };
            }

            /**
             * @param id
             * @returns {string}
             * @private
             */
            static _getAssetId(id) {
                return id || WavesApp.defaultAssets.WAVES;
            }

        }

        return new Matcher();
    };

    factory.$inject = ['utils', 'decorators'];

    angular.module('app').factory('matcher', factory);
})();

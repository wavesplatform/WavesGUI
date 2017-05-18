(function () {
    'use strict';

    var ACCEPTED = 'Accepted',
        PARTIALLY = 'PartiallyFilled',
        FILLED = 'Filled',
        CANCELLED = 'Cancelled',
        NOT_FOUND = 'NotFound',

        ORDER_CANCELED = 'OrderCanceled',
        ORDER_DELETED = 'OrderDeleted';

    function DexOrderService(matcherRequestService, matcherApiService, applicationContext) {

        // TODO : clean that all from the state.

        this.addOrder = function (pair, order, sender) {
            return matcherApiService
                .loadMatcherKey()
                .then(function (matcherKey) {
                    order.matcherKey = matcherKey;
                    var signedRequest = matcherRequestService.buildCreateOrderRequest(order, sender);
                    return matcherApiService.createOrder(signedRequest);
                }).catch(function (e) {
                    throw new Error(); // TODO
                });
        };

        this.removeOrder = function (pair, order, sender) {
            var signedRequest = matcherRequestService.buildCancelOrderRequest(order.id, sender);
            if (order.status === ACCEPTED || order.status === PARTIALLY) {
                return matcherApiService
                    .cancelOrder(pair.amountAsset.id, pair.priceAsset.id, signedRequest)
                    .then(function (response) {
                        if (response.status !== ORDER_CANCELED) {
                            throw new Error();
                        }
                    }).catch(function (e) {
                        throw new Error(); // TODO
                    });
            } else if (order.status === FILLED || order.status === CANCELLED) {
                return matcherApiService
                    .deleteOrder(pair.amountAsset.id, pair.priceAsset.id, signedRequest)
                    .then(function (response) {
                        if (response.status !== ORDER_DELETED) {
                            throw new Error();
                        }
                    }).catch(function (e) {
                        throw new Error(); // TODO
                    });
            }
        };

        this.getOrders = function (pair) {
            return matcherApiService
                .loadUserOrders(pair.amountAsset.id, pair.priceAsset.id, {
                    publicKey: applicationContext.account.keyPair.public,
                    privateKey: applicationContext.account.keyPair.private
                })
                .then(function (response) {
                    return response.map(function (order) {
                        var orderPrice = OrderPrice.fromBackendPrice(order.price, pair).toTokens();

                        return {
                            id: order.id,
                            type: order.type,
                            price: Money.fromTokens(orderPrice, pair.priceAsset),
                            amount: Money.fromCoins(order.amount, pair.amountAsset),
                            filled: Money.fromCoins(order.filled, pair.amountAsset),
                            status: order.status || NOT_FOUND,
                            timestamp: order.timestamp
                        };
                    });
                })
                .catch(function (e) {
                    throw new Error(); // TODO
                });
        };
    }

    DexOrderService.$inject = ['matcherRequestService', 'matcherApiService', 'applicationContext'];

    angular
        .module('app.dex')
        .service('dexOrderService', DexOrderService);
})();

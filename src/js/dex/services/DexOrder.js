(function () {
    'use strict';

    const ACCEPTED = `Accepted`;
    const PARTIALLY = `PartiallyFilled`;
    const FILLED = `Filled`;
    const CANCELLED = `Cancelled`;
    const NOT_FOUND = `NotFound`;

    const ORDER_CANCELED = `OrderCanceled`;
    const ORDER_DELETED = `OrderDeleted`;

    function DexOrder(matcherRequestService, matcherApiService, applicationContext) {

        // TODO : clean that all from the state.

        this.addOrder = function (pair, order, sender) {
            return matcherApiService
                .loadMatcherKey()
                .then((matcherKey) => {
                    order.matcherKey = matcherKey;
                    const signedRequest = matcherRequestService.buildCreateOrderRequest(order, sender);
                    return matcherApiService.createOrder(signedRequest);
                })
                .catch((e) => {
                    throw new Error(e);
                });
        };

        this.removeOrder = function (pair, order, sender) {
            const signedRequest = matcherRequestService.buildCancelOrderRequest(order.id, sender);
            if (order.status === ACCEPTED || order.status === PARTIALLY) {
                return matcherApiService
                    .cancelOrder(pair.amountAsset.id, pair.priceAsset.id, signedRequest)
                    .then((response) => {
                        if (response.status !== ORDER_CANCELED) {
                            throw new Error();
                        }
                    })
                    .catch((e) => {
                        throw new Error(e);
                    });
            } else if (order.status === FILLED || order.status === CANCELLED) {
                return matcherApiService
                    .deleteOrder(pair.amountAsset.id, pair.priceAsset.id, signedRequest)
                    .then((response) => {
                        if (response.status !== ORDER_DELETED) {
                            throw new Error();
                        }
                    })
                    .catch((e) => {
                        throw new Error(e);
                    });
            }
        };

        this.getOrders = function (pair) {
            return matcherApiService
                .loadUserOrders(pair.amountAsset.id, pair.priceAsset.id, {
                    publicKey: applicationContext.account.keyPair.public,
                    privateKey: applicationContext.account.keyPair.private
                })
                .then((response) => response.map((o) => {
                    if (o.amount === null || o.price === null || o.filled === null || o.timestamp === null) {
                        o.amount = o.amount || 0;
                        o.price = o.price || 0;
                        o.filled = o.filled || 0;
                        o.timestamp = o.timestamp || 0;
                        throw new Error(`Bad order!`, o);
                    }

                    const orderPrice = OrderPrice.fromBackendPrice(o.price, pair).toTokens();

                    return {
                        id: o.id,
                        type: o.type,
                        price: Money.fromTokens(orderPrice, pair.priceAsset),
                        amount: Money.fromCoins(o.amount, pair.amountAsset),
                        filled: Money.fromCoins(o.filled, pair.amountAsset),
                        status: o.status || NOT_FOUND,
                        timestamp: o.timestamp
                    };
                }))
                .catch((e) => {
                    throw new Error(e);
                });
        };
    }

    DexOrder.$inject = [`matcherRequestService`, `matcherApiService`, `applicationContext`];

    angular
        .module(`app.dex`)
        .service(`dexOrderService`, DexOrder);
})();

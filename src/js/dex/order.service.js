(function () {
    'use strict';

    var ACCEPTED = 'Accepted',
        PARTIALLY = 'PartiallyFilled',
        FILLED = 'Filled',
        CANCELLED = 'Cancelled',
        ORDER_CANCELED = 'OrderCanceled';

    function serializeMoney(amount) {
        return {
            amount: amount.toTokens(),
            currency: amount.currency
        };
    }

    function serializeOrderPrice(price) {
        return {
            price: price.toTokens(),
            pair: {
                amountAsset: price.amountAsset,
                priceAsset: price.priceAsset
            }
        };
    }

    function deserializeCurrency(currency) {
        return Currency.create(currency);
    }

    function deserializeMoney(amount) {
        return Money.fromTokens(amount.amount, deserializeCurrency(amount.currency));
    }

    function deserializeOrderPrice(orderPrice, amount) {
        if (orderPrice.amount) {
            var oldPrice = orderPrice;
            var amountAsset = deserializeCurrency(amount.currency);
            var priceAsset = deserializeCurrency(oldPrice.currency);

            return OrderPrice.fromTokens(oldPrice.amount, {
                amountAsset: amountAsset,
                priceAsset: priceAsset
            });
        } else {
            return OrderPrice.fromTokens(orderPrice.price, {
                amountAsset: deserializeCurrency(orderPrice.pair.amountAsset),
                priceAsset: deserializeCurrency(orderPrice.pair.priceAsset)
            });
        }
    }

    function serializeOrder(order) {
        return {
            id: order.id,
            status: order.status,
            orderType: order.orderType,
            price: serializeOrderPrice(order.price),
            amount: serializeMoney(order.amount)
        };
    }

    function deserializeOrder(json) {
        return {
            id: json.id,
            status: json.status,
            orderType: json.orderType,
            price: deserializeOrderPrice(json.price, json.amount),
            amount: deserializeMoney(json.amount)
        };
    }

    function buildPairKey(pair) {
        return pair.amountAssetId + '_' + pair.priceAssetId;
    }

    function DexOrderService($q, storageService, matcherRequestService, matcherApiService) {
        function loadState() {
            return storageService.loadState().then(function (state) {
                state = state || {};
                if (!state.orders) {
                    state.orders = {};
                }
                return state;
            });
        }

        this.addOrder = function (pair, order, sender) {
            return loadState().then(function (state) {
                return matcherApiService
                    // Getting the matcher key.
                    .loadMatcherKey()
                    // Signing the order.
                    .then(function (matcherKey) {
                        order.matcherKey = matcherKey;
                        return matcherRequestService.buildCreateOrderRequest(order, sender);
                    })
                    // Sending it to matcher.
                    .then(matcherApiService.createOrder)
                    // Saving the order with its ID to the storage.
                    .then(function (response) {
                        var array = state.orders[buildPairKey(pair)] || [];
                        order.id = response.message.id;
                        array.push(serializeOrder(order));
                        state.orders[buildPairKey(pair)] = array;

                        return state;
                    });
            }).then(storageService.saveState);
        };

        this.removeOrder = function (pair, order, sender) {

            if (!order.status || order.status === ACCEPTED || order.status === PARTIALLY) {

                // If the order is "live", we send request to server to cancel it.
                // The order becomes "dead" and with the next remove click it'll be gone.
                return $q.when().then(function () {
                    return matcherRequestService.buildCancelOrderRequest(order.id, sender);
                }).then(function (signedRequest) {
                    return matcherApiService.cancelOrder(pair.amountAssetId, pair.priceAssetId, signedRequest);
                }).then(function (response) {
                    if (response.status !== ORDER_CANCELED) {
                        throw new Error();
                    }
                });

            } else {

                // Order is "dead" already, and now is removed from locally saved state.
                return loadState().then(function (state) {
                    return $q.when().then(function () {
                        var array = state.orders[buildPairKey(pair)] || [];
                        var index = _.findIndex(array, {id: order.id});
                        if (index >= 0) {
                            array.splice(index, 1);
                        }
                        state.orders[buildPairKey(pair)] = array;

                        return state;
                    });
                }).then(storageService.saveState);

            }
        };

        this.getOrders = function (pair) {
            return loadState().then(function (state) {
                return state.orders[buildPairKey(pair)] || [];
            }).then(function (orders) {
                var q = $q.when(),
                    ordersWithStatus = [];

                // Complementing orders with their actual statuses.
                orders.forEach(function (order) {
                    // Chaining `then`s for the whole array of orders.
                    q = q.then(function () {
                        if (!order.status || order.status === ACCEPTED || order.status === PARTIALLY) {
                            // While order status can change further we check it on server (asynchronously).
                            return matcherApiService
                                .orderStatus(pair.amountAssetId, pair.priceAssetId, order.id)
                                .then(function (response) {
                                    order.status = response.status;
                                    ordersWithStatus.push(order);
                                    return ordersWithStatus;
                                });
                        } else if (order.status === FILLED || order.status === CANCELLED) {
                            // Otherwise we just leave it as is (synchronously).
                            // 'NotFound' orders are dropped.
                            ordersWithStatus.push(order);
                            return ordersWithStatus;
                        }
                    });
                });

                return q;
            }).then(function (orders) {
                // Finally, we save orders with refreshed statuses in state.
                return loadState().then(function (state) {
                    state.orders[buildPairKey(pair)] = orders;
                    return state;
                }).then(storageService.saveState).then(function () {
                    return orders;
                });
            }).then(function (orders) {
                // And here we just wrap values in Currency and Money and send all to the outer code.
                return _.map(orders, deserializeOrder);
            });
        };
    }

    DexOrderService.$inject = ['$q', 'storageService', 'matcherRequestService', 'matcherApiService'];

    angular
        .module('app.dex')
        .service('dexOrderService', DexOrderService);
})();

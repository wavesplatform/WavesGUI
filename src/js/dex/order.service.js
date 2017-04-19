(function () {
    'use strict';

    var ACCEPTED = 'Accepted',
        PARTIALLY = 'PartiallyFilled',
        FILLED = 'Filled',
        CANCELLED = 'Cancelled',
        NOT_FOUND = 'NotFound',

        ORDER_CANCELED = 'OrderCanceled',
        ORDER_CANCEL_REJECTED = 'OrderCancelRejected';

    function serializeAmount(amount) {
        return amount.toTokens();
    }

    function serializeOrderPrice(price) {
        return price.toTokens();
    }

    function serializeOrder(order) {
        return {
            id: order.id,
            status: order.status,
            orderType: order.orderType,
            price: serializeOrderPrice(order.price),
            amount: serializeAmount(order.amount)
        };
    }

    function deserializeAmount(amount, currency) {
        // Here we deal with old amount format.
        if (typeof amount === 'object') {
            amount = amount.amount;
        }

        return Money.fromTokens(amount, currency);
    }

    function deserializeOrderPrice(orderPrice, pair) {
        // Here we deal with old price format.
        if (typeof orderPrice === 'object') {
            orderPrice = orderPrice.amount ? orderPrice.amount : orderPrice.price;
        }

        return OrderPrice.fromTokens(orderPrice, {
            amountAsset: pair.amountAsset,
            priceAsset: pair.priceAsset
        });
    }

    function deserializeOrder(json, pair) {
        return {
            id: json.id,
            status: json.status,
            orderType: json.orderType,
            price: deserializeOrderPrice(json.price, pair),
            amount: deserializeAmount(json.amount, pair.amountAsset)
        };
    }

    function buildPairKey(pair) {
        return pair.amountAsset.id + '_' + pair.priceAsset.id;
    }

    function DexOrderService($q, storageService, matcherRequestService, matcherApiService, utilityService,
                             applicationContext) {

        var currentAddress = applicationContext.account.address;

        function loadState() {
            return storageService.loadState().then(function (state) {
                state = state || {};
                if (!state.orders) {
                    state.orders = {};
                }

                if (!state.orders.byAddress) {
                    state.orders.byAddress = {};
                }

                if (!state.orders.byAddress[currentAddress]) {
                    state.orders.byAddress[currentAddress] = {};
                }

                return state;
            });
        }

        function purgeOrder(pair, order) {
            return loadState().then(function (state) {
                return $q.when().then(function () {
                    removeOrderFromMap(state.orders, pair, order);
                    removeOrderFromMap(state.orders.byAddress[currentAddress], pair, order);

                    return state;
                });
            }).then(storageService.saveState);
        }

        function removeOrderFromMap(ordersObject, pair, order) {
            if (!ordersObject || !ordersObject[buildPairKey(pair)]) {
                return;
            }

            var array = ordersObject[buildPairKey(pair)];
            var index = _.findIndex(array, {id: order.id});
            if (index >= 0) {
                array.splice(index, 1);
            }

            ordersObject[buildPairKey(pair)] = array;
        }

        this.addOrder = function (pair, order, sender) {
            return loadState().then(function (state) {
                return matcherApiService
                    // Getting the matcher key.
                    .loadMatcherKey()
                    // Signing the order.
                    .then(function (matcherKey) {
                        order.matcherKey = matcherKey;
                        //FIXME: remove this timestamp patch after node release
                        // current time minus ten minutes
                        //------------------------------------------------------
                        order.time = utilityService.getTime() - 10 * 60 * 1000;
                        //------------------------------------------------------
                        return matcherRequestService.buildCreateOrderRequest(order, sender);
                    })
                    // Sending it to matcher.
                    .then(matcherApiService.createOrder)
                    // Saving the order with its ID to the storage.
                    .then(function (response) {
                        var array = state.orders.byAddress[currentAddress][buildPairKey(pair)] || [];
                        order.id = response.message.id;
                        array.push(serializeOrder(order));
                        state.orders.byAddress[currentAddress][buildPairKey(pair)] = array;

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
                    return matcherApiService.cancelOrder(pair.amountAsset.id, pair.priceAsset.id, signedRequest);
                }).then(function (response) {
                    if (response.status !== ORDER_CANCELED) {
                        throw new Error();
                    }
                }).catch(function (e) {
                    if (e.data && e.data.status === ORDER_CANCEL_REJECTED) {
                        return purgeOrder(pair, order);
                    }
                });

            } else {
                // Order is "dead" already, and now is removed from locally saved state.
                return purgeOrder(pair, order);
            }
        };

        this.getOrders = function (pair) {
            return loadState().then(function (state) {
                var currentVersion = state.version || 0;

                // we have to copy orders to the new location and use it in the future
                if (currentVersion === 0) {
                    var ordersByAddress = state.orders.byAddress[currentAddress] || {};
                    _.mapObject(state.orders, function (value, key) {
                        if (key === 'byAddress') {
                            return;
                        }

                        ordersByAddress[key] = _.clone(value);
                    });

                    state.orders.byAddress[currentAddress] = ordersByAddress;
                    state.version = storageService.getStorageVersion();
                    storageService.saveState(state);
                }

                return state.orders.byAddress[currentAddress][buildPairKey(pair)] || [];
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
                                .orderStatus(pair.amountAsset.id, pair.priceAsset.id, order.id)
                                .then(function (response) {
                                    order.status = response.status || NOT_FOUND;
                                    ordersWithStatus.push(order);
                                    return ordersWithStatus;
                                }).catch(function (e) {
                                    console.log(e);
                                    order.status = NOT_FOUND;
                                    ordersWithStatus.push(order);
                                    return ordersWithStatus;
                                });
                        } else if (order.status === FILLED || order.status === CANCELLED) {
                            // Otherwise we just leave it as is (synchronously).
                            // 'NotFound' orders are dropped.
                            ordersWithStatus.push(order);
                            return ordersWithStatus;
                        } else {
                            return ordersWithStatus;
                        }
                    });
                });

                return q;
            }).then(function (orders) {
                orders = _.map(orders, function (order) {
                    return deserializeOrder(order, pair);
                });

                // Finally, we save orders with refreshed statuses in state.
                return loadState().then(function (state) {
                    state.orders.byAddress[currentAddress][buildPairKey(pair)] = _.map(orders, serializeOrder);
                    return state;
                }).then(storageService.saveState).then(function () {
                    return orders;
                });
            });
        };
    }

    DexOrderService.$inject = ['$q', 'storageService', 'matcherRequestService', 'matcherApiService', 'utilityService',
        'applicationContext'];

    angular
        .module('app.dex')
        .service('dexOrderService', DexOrderService);
})();

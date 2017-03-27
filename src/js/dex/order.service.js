(function () {
    'use strict';

    function serializeMoney(amount) {
        return {
            amount: amount.toTokens(),
            currency: amount.currency
        };
    }

    function deserializeCurrency(json) {
        // It's not a perfect solution.
        // Currencies created here won't be equivalent (===) to predefined currencies
        return new Currency(json);
    }

    function deserializeMoney(json) {
        return Money.fromTokens(json.amount, deserializeCurrency(json.currency));
    }

    function serializeOrder(order) {
        return {
            id: order.id,
            status: order.status,
            orderType: order.orderType,
            price: serializeMoney(order.price),
            amount: serializeMoney(order.amount)
        };
    }

    function deserializeOrder(json) {
        return {
            id: json.id,
            status: json.status,
            orderType: json.orderType,
            price: deserializeMoney(json.price),
            amount: deserializeMoney(json.amount)
        };
    }

    function buildPairKey(pair) {
        return pair.amountAssetId + '_' + pair.priceAssetId;
    }

    function DexOrderService(storageService, matcherRequestService, matcherApiService) {
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
                return Promise.resolve()
                    .then(matcherApiService.loadMatcherKey)
                    .then(function (matcherKey) {
                        order.matcherKey = matcherKey;
                        return matcherRequestService.buildCreateOrderRequest(order, sender);
                    })
                    .then(function (signedOrder) {
                        return signedOrder;
                    })
                    .then(matcherApiService.createOrder)
                    .then(function (response) {
                        console.log(response); // TODO : make a notification.
                        var array = state.orders[buildPairKey(pair)] || [];
                        order.id = response.message.id;
                        array.push(serializeOrder(order));
                        state.orders[buildPairKey(pair)] = array;

                        return state;
                    });
            }).then(storageService.saveState);
        };

        this.removeOrder = function (pair, order) {
            return loadState().then(function (state) {
                var array = state.orders[buildPairKey(pair)] || [];
                var index = _.findIndex(array, {id: order.id});
                if (index >= 0) {
                    array.splice(index, 1);
                }
                state.orders[buildPairKey(pair)] = array;

                return state;
            }).then(storageService.saveState);
        };

        this.getOrders = function (pair) {
            return loadState().then(function (state) {
                return state.orders[buildPairKey(pair)] || [];
            }).then(function (rawOrders) {
                return _.map(rawOrders, deserializeOrder);
            });
        };
    }

    DexOrderService.$inject = ['storageService', 'matcherRequestService', 'matcherApiService'];

    angular
        .module('app.dex')
        .service('dexOrderService', DexOrderService);
})();

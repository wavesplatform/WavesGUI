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
        return new Currency(json.currency);
    }

    function deserializeMoney(json) {
        return Money.fromTokens(json.amount, deserializeCurrency(json.currency));
    }

    function serializeOrder(order) {
        return {
            id: order.id,
            status: order.status,
            type: order.type,
            quantity: serializeMoney(order.quantity),
            price: serializeMoney(order.price),
            total: serializeMoney(order.total)
        };
    }

    function deserializeOrder(json) {
        return {
            id: json.id,
            status: json.status,
            type: json.type,
            quantity: deserializeMoney(json.quantity),
            price: deserializeMoney(json.price),
            total: deserializeMoney(json.total)
        };
    }

    function buildPairKey(pair) {
        return pair.amountAssetId + '_' + pair.priceAssetId;
    }

    function WavesDexOrderService(storageService) {
        function loadState() {
            return storageService.loadState().then(function (state) {
                state = state || {};
                if (!state.orders) {
                    state.orders = {};
                }
                return state;
            });
        }

        this.addOrder = function (pair, order) {
            return loadState().then(function (state) {
                var array = state.orders[buildPairKey(pair)] || [];
                array.push(serializeOrder(order));
                state.orders[buildPairKey(pair)] = array;

                return state;
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

    WavesDexOrderService.$inject = ['storageService'];

    angular
        .module('app.dex')
        .service('dexOrderService', WavesDexOrderService);
})();

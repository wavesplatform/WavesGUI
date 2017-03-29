(function () {
    'use strict';

    function denormalizeOrders(orders) {
        if (!orders || !orders.length) {
            return [];
        }

        var currentSum = 0;
        return orders.map(function (order) {
            var total = order.price * order.amount;
            currentSum += total;
            return {
                id: order.id,
                price: order.price,
                amount: order.amount,
                total: total,
                sum: currentSum
            };
        });
    }

    function OrderbookController() {
        var ctrl = this;

        ctrl.$onChanges = function (changes) {
            if (!changes.rawOrders) {
                return;
            }

            var denormPreviousValue = denormalizeOrders(changes.rawOrders.previousValue),
                denormCurrentValue = denormalizeOrders(changes.rawOrders.currentValue);

            if (!_.isEqual(denormPreviousValue, denormCurrentValue)) {
                ctrl.orders = denormCurrentValue;
            }
        };
    }

    angular
        .module('app.dex')
        .component('wavesDexOrderbook', {
            controller: OrderbookController,
            bindings: {
                type: '@',
                name: '@',
                pair: '<',
                rawOrders: '<orders'
            },
            templateUrl: 'dex/orderbook.component'
        });
})();

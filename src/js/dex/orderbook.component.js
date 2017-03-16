(function () {
    'use strict';

    function denormalizeOrders(orders) {
        var currentSum = 0;
        return orders.map(function (order) {
            var total = order.price * order.amount;
            currentSum += total;
            return {
                price: order.price,
                amount: order.amount,
                total: total,
                sum: currentSum
            };
        });
    }

    function OrderbookController() {
        var ctrl = this;

        ctrl.$onChanges = function () {
            ctrl.orders = denormalizeOrders(ctrl.orders);
        };
    }

    angular
        .module('app.dex')
        .component('wavesDexOrderbook', {
            controller: OrderbookController,
            bindings: {
                name: '@',
                orders: '<'
            },
            templateUrl: 'dex/orderbook.component'
        });
})();

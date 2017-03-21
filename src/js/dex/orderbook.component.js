(function () {
    'use strict';

    // Only non-user orderbooks need that denorm.
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

        if (ctrl.type !== 'user') {
            ctrl.$onChanges = function () {
                ctrl.orders = denormalizeOrders(ctrl.rawOrders);
            };
        }
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

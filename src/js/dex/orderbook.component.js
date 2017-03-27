(function () {
    'use strict';

    var types = {
        buy: 'Buy',
        sell: 'Sell'
    };

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

    function denormalizeUserOrders(orders) {
        return orders.map(function (order) {
            var price = order.price.toTokens(),
                amount = order.amount.toTokens();
            return {
                status: order.status,
                type: types[order.orderType],
                price: price,
                amount: amount,
                total: price * amount
            };
        });
    }

    function OrderbookController() {
        var ctrl = this;

        ctrl.$onChanges = function () {
            if (ctrl.type !== 'user') {
                ctrl.orders = denormalizeOrders(ctrl.rawOrders);
            } else {
                ctrl.orders = denormalizeUserOrders(ctrl.rawOrders);
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

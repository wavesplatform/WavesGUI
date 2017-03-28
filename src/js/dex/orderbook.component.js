(function () {
    'use strict';

    var types = {
        buy: 'Buy',
        sell: 'Sell'
    };

    // Only non-user orderbooks need that denorm.
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

    function denormalizeUserOrders(orders) {
        if (!orders || !orders.length) {
            return [];
        }

        return orders.map(function (order) {
            var price = order.price.toTokens(),
                amount = order.amount.toTokens();
            return {
                id: order.id,
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

        ctrl.cancel = function (obj) {
            ctrl.cancelOrder(obj.order);
        };

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
                rawOrders: '<orders',
                cancelOrder: '<'
            },
            templateUrl: 'dex/orderbook.component'
        });
})();

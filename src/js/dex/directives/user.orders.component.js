(function () {
    'use strict';

    var statuses = {
        'PartiallyFilled': {
            title: 'Partial',
            order: 2
        },
        'Accepted': {
            title: 'Opened',
            order: 4
        },
        'Filled': {
            title: 'Closed',
            order: 6
        },
        'Cancelled': {
            title: 'Canceled',
            order: 8
        },
        'NotFound': {
            title: 'NotFound',
            order: 10
        }
    };

    var types = {
        'buy': {
            title: 'Buy',
            order: 0
        },
        'sell': {
            title: 'Sell',
            order: 1
        }
    };

    function status(s) {
        return statuses[s] ? statuses[s].title : '---';
    }

    function type(t) {
        return types[t] ? types[t].title : '---';
    }

    function denormalizeUserOrders(orders) {
        if (!orders || !orders.length) {
            return [];
        }

        return orders.map(function (order) {
            var price = order.price.toTokens(),
                amount = order.amount.toTokens(),
                filled = order.filled.toTokens();

            return {
                id: order.id,
                status: order.status,
                statusTitle: status(order.status),
                type: order.type,
                typeTitle: type(order.type),
                price: price,
                amount: amount,
                total: price * amount,
                filled: filled,
                timestamp: order.timestamp
            };
        });
    }

    function sortUserOrders(orders) {
        return orders.sort(function (a, b) {
            var aVal = statuses[a.status].order + types[a.type].order,
                bVal = statuses[b.status].order + types[b.type].order;
            return aVal - bVal;
        });
    }

    function UserOrdersController() {
        var ctrl = this;

        ctrl.cancel = function (obj) {
            ctrl.cancelOrder(obj.order);
        };

        ctrl.$onChanges = function (changes) {
            if (!changes.rawOrders) {
                return;
            }

            var denormPreviousValue = denormalizeUserOrders(changes.rawOrders.previousValue),
                denormCurrentValue = denormalizeUserOrders(changes.rawOrders.currentValue);

            if (!_.isEqual(denormPreviousValue, denormCurrentValue)) {
                ctrl.orders = sortUserOrders(denormCurrentValue);
            }
        };
    }

    angular
        .module('app.dex')
        .component('wavesDexUserOrders', {
            controller: UserOrdersController,
            bindings: {
                pair: '<',
                rawOrders: '<orders',
                cancelOrder: '<'
            },
            templateUrl: 'dex/user.orders.component'
        });
})();

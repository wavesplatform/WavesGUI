(function () {
    'use strict';

    const statuses = {
        PartiallyFilled: {
            title: `Partial`,
            order: 2
        },
        Accepted: {
            title: `Opened`,
            order: 4
        },
        Filled: {
            title: `Closed`,
            order: 6
        },
        Cancelled: {
            title: `Canceled`,
            order: 8
        },
        NotFound: {
            title: `NotFound`,
            order: 10
        }
    };

    const types = {
        buy: {
            title: `Buy`,
            order: 0
        },
        sell: {
            title: `Sell`,
            order: 1
        }
    };

    function status(s) {
        return statuses[s] ? statuses[s].title : `---`;
    }

    function type(t) {
        return types[t] ? types[t].title : `---`;
    }

    function denormalizeUserOrders(orders) {
        if (!orders || !orders.length) {
            return [];
        }

        return orders.map((order) => {
            const price = order.price.toTokens();
            const amount = order.amount.toTokens();
            const filled = order.filled.toTokens();

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
        return orders.sort((a, b) => {
            const aVal = statuses[a.status].order + types[a.type].order;
            const bVal = statuses[b.status].order + types[b.type].order;
            return aVal - bVal;
        });
    }

    function UserOrders() {
        const ctrl = this;

        ctrl.cancel = function (obj) {
            ctrl.cancelOrder(obj.order);
        };

        ctrl.$onChanges = function (changes) {
            if (!changes.rawOrders) {
                return;
            }

            const denormPreviousValue = denormalizeUserOrders(changes.rawOrders.previousValue);
            const denormCurrentValue = denormalizeUserOrders(changes.rawOrders.currentValue);

            if (!_.isEqual(denormPreviousValue, denormCurrentValue)) {
                ctrl.orders = sortUserOrders(denormCurrentValue);
            }
        };
    }

    angular
        .module(`app.dex`)
        .component(`wavesDexUserOrders`, {
            controller: UserOrders,
            bindings: {
                pair: `<`,
                rawOrders: `<orders`,
                cancelOrder: `<`
            },
            templateUrl: `dex/user.orders.component`
        });
})();

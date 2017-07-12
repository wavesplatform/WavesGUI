(function () {
    'use strict';

    function denormalizeOrders(orders) {
        if (!orders || !orders.length) {
            return [];
        }

        let currentSum = 0;
        return orders.map((order) => {
            const total = order.price * order.amount;
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

    function calculateStringLength(n, precision) {
        // Get initial string length with a given precision.
        const len = n.toFixed(precision).length;
        // Add some length for commas (e.g. 10,000,000.0000).
        return len + Math.floor(n.toFixed(0).length / 3);
    }

    function getMaxLengths(orders, pair) {
        let price = 0,
            amount = 0,
            total = 0,
            sum = 0;

        // Get max value for each column.
        orders.forEach((order) => {
            if (order.price > price) {
                price = order.price;
            }
            if (order.amount > amount) {
                amount = order.amount;
            }
            if (order.total > total) {
                total = order.total;
            }
            if (order.sum > sum) {
                sum = order.sum;
            }
        });

        return {
            price: calculateStringLength(price, pair.priceAsset.precision),
            amount: calculateStringLength(amount, pair.amountAsset.precision),
            total: calculateStringLength(total, pair.priceAsset.precision),
            sum: calculateStringLength(sum, pair.priceAsset.precision)
        };
    }

    function Orderbook() {
        const ctrl = this;

        ctrl.lineClick = function (index) {
            const order = ctrl.orders[index];
            const cumulativeAmount = ctrl.orders.slice(0, index + 1).reduce((sum, order) => sum + order.amount, 0);

            ctrl.onClick(order.price, cumulativeAmount, order.sum);
        };

        ctrl.$onChanges = function (changes) {
            if (!changes.rawOrders) {
                return;
            }

            const denormPreviousValue = denormalizeOrders(changes.rawOrders.previousValue);
            const denormCurrentValue = denormalizeOrders(changes.rawOrders.currentValue);

            if (!_.isEqual(denormPreviousValue, denormCurrentValue)) {
                ctrl.orders = denormCurrentValue;
                ctrl.lengths = getMaxLengths(ctrl.orders, ctrl.pair);
            }
        };
    }

    angular
        .module(`app.dex`)
        .component(`wavesDexOrderbook`, {
            controller: Orderbook,
            bindings: {
                type: `@`,
                name: `@`,
                pair: `<`,
                onClick: `<`,
                rawOrders: `<orders`
            },
            templateUrl: `dex/orderbook.component`
        });
})();

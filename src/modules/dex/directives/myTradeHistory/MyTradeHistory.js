(function () {
    'use strict';

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {IPollCreate} createPoll
     * @param {Waves} waves
     * @return {MyTradeHistory}
     */
    const controller = function (Base, $scope, createPoll, waves) {

        const tsUtils = require('ts-utils');

        class MyTradeHistory extends Base {

            constructor() {
                super();

                /**
                 * @type {Array}
                 */
                this.orders = null;
                /**
                 * @type {boolean}
                 */
                this.pending = true;

                this.headers = [
                    {
                        id: 'pair',
                        valuePath: 'item.pair',
                        search: true
                    },
                    {
                        id: 'type',
                        title: { literal: 'directives.myOrders.type' },
                        valuePath: 'item.type',
                        sort: true
                    },
                    {
                        id: 'price',
                        title: { literal: 'directives.myOrders.price' },
                        valuePath: 'item.price',
                        sort: true
                    },
                    {
                        id: 'amount',
                        title: { literal: 'directives.myOrders.amount' },
                        valuePath: 'item.amount',
                        sort: true
                    },
                    {
                        id: 'total',
                        title: { literal: 'directives.myOrders.total' },
                        valuePath: 'item.total',
                        sort: true
                    },
                    {
                        id: 'fee',
                        title: { literal: 'directives.myOrders.fee' },
                        valuePath: 'item.fee',
                        sort: true
                    },
                    {
                        id: 'time',
                        title: { literal: 'directives.myOrders.time' },
                        valuePath: 'item.timestamp',
                        sort: true,
                        sortActive: true,
                        isAsc: false
                    },
                    {
                        id: 'status',
                        title: { literal: 'directives.myOrders.status' },
                        valuePath: 'item.percent',
                        sort: true
                    }
                ];

                createPoll(this, this._getOrders, 'orders', 1000, { $scope }).ready
                    .then(() => {
                        this.pending = false;
                    });
            }

            /**
             * @param {IOrder} order
             */
            deleteOrder(order) {
                ds.cancelOrder(order.amount.asset.id, order.price.asset.id, order.id, 'delete');
            }

            _getOrders() {
                return waves.matcher.getOrders()
                    .then((orders) => orders.filter(tsUtils.contains({ isActive: false })));
            }

        }

        return new MyTradeHistory();
    };

    controller.$inject = ['Base', '$scope', 'createPoll', 'waves'];

    angular.module('app.dex').component('wDexMyTradeHistory', {
        bindings: {},
        templateUrl: 'modules/dex/directives/myTradeHistory/myTradeHistory.html',
        controller
    });
})();

(function () {
    'use strict';

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {IPollCreate} createPoll
     * @param {Waves} waves
     * @return {MyTradeHistory}
     */
    const controller = function (Base, $scope, createPoll, waves, user) {

        const tsUtils = require('ts-utils');
        const entities = require('@waves/data-entities');

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
                /**
                 * @type {Object.<string, boolean>}
                 */
                this.expandedOrdersHash = Object.create(null);

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
                        id: 'time',
                        title: { literal: 'directives.myOrders.time' },
                        valuePath: 'item.timestamp',
                        sort: true,
                        sortActive: true,
                        isAsc: false
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
                        id: 'status',
                        title: { literal: 'directives.myOrders.status' },
                        valuePath: 'item.progress',
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
            setPair(order) {
                user.setSetting('dex.assetIdPair', {
                    amount: order.assetPair.amountAsset.id,
                    price: order.assetPair.priceAsset.id
                });
            }

            toggleExpand(id, state) {
                this.expandedOrdersHash[id] = state;
            }

            /**
             * @param {IOrder} order
             */
            deleteOrder(order) {
                ds.cancelOrder(order.amount.asset.id, order.price.asset.id, order.id, 'delete');
            }

            _getOrders() {
                return waves.matcher.getOrders()
                    .then((orders) => orders.filter(tsUtils.contains({ isActive: false })))
                    .then((orders) => MyTradeHistory._remapOrders(orders))
                    .then((orders) => {
                        const last = orders.length ? orders[orders.length - 1] : null;

                        if (!last) {
                            return orders;
                        } else {
                            return ds.api.transactions.getExchangeTxList({
                                sender: user.address,
                                timeStart: last.timestamp
                            })
                                .then((txList) => {
                                    const transactionsByOrderHash = Object.create(null);
                                    const txHash = Object.create(null); // TODO remove after Dima clean duplicates
                                    txList.forEach((tx) => {
                                        if (!txHash[tx.id]) {
                                            ['order1', 'order2'].forEach((orderFieldName) => {
                                                if (!transactionsByOrderHash[tx[orderFieldName].id]) {
                                                    transactionsByOrderHash[tx[orderFieldName].id] = [];
                                                }
                                                transactionsByOrderHash[tx[orderFieldName].id].push(tx);
                                            });
                                        }
                                        txHash[tx.id] = true;
                                    });
                                    return orders.map((order) => {
                                        if (!transactionsByOrderHash[order.id]) {
                                            transactionsByOrderHash[order.id] = [];
                                        }
                                        if (transactionsByOrderHash[order.id].length) {
                                            order.fee = transactionsByOrderHash[order.id]
                                                .map(MyTradeHistory._getFeeByType(order.type))
                                                .reduce((sum, fee) => sum.add(fee));
                                        }
                                        order.exchange = transactionsByOrderHash[order.id].map((tx) => {
                                            const totalBigNum = tx.amount.getTokens().times(tx.price.getTokens());
                                            const total = entities.Money.fromTokens(totalBigNum, tx.price.asset);
                                            const fee = MyTradeHistory._getFeeByType(order.type)(tx);
                                            return { ...tx, total, fee };
                                        });
                                        return order;
                                    });
                                });
                        }
                    });
            }

            static _getFeeByType(type) {
                return function (tx) {
                    switch (type) {
                        case 'buy':
                            return tx.buyOrder.matcherFee;
                        case 'sell':
                            return tx.sellOrder.matcherFee;
                        default:
                            throw new Error('Wrong order type!');
                    }
                };
            }

            /**
             * @param {Array<IOrder>} orders
             * @private
             */
            static _remapOrders(orders) {
                return orders.map((order) => {
                    const assetPair = order.assetPair;
                    const pair = `${assetPair.amountAsset.displayName} / ${assetPair.priceAsset.displayName}`;
                    const percent = new BigNumber(order.progress * 100).dp(2).toFixed();
                    return { ...order, percent, pair };
                });
            }

        }

        return new MyTradeHistory();
    };

    controller.$inject = ['Base', '$scope', 'createPoll', 'waves', 'user'];

    angular.module('app.dex').component('wDexMyTradeHistory', {
        bindings: {},
        templateUrl: 'modules/dex/directives/myTradeHistory/myTradeHistory.html',
        controller
    });
})();

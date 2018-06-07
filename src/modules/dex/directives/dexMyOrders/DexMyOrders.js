(function () {
    'use strict';

    /**
     * @param Base
     * @param {Waves} waves
     * @param {User} user
     * @param {IPollCreate} createPoll
     * @param {INotification} notification
     * @param {app.utils} utils
     * @param {$rootScope.Scope} $scope
     * @param orderStatuses
     * @return {DexMyOrders}
     */
    const controller = function (
        Base,
        waves,
        user,
        createPoll,
        notification,
        utils,
        $scope
    ) {

        const tsUtils = require('ts-utils');

        class DexMyOrders extends Base {

            constructor() {
                super();

                /**
                 * @type {{amount: string, price: string}}
                 * @private
                 */
                this._assetIdPair = null;

                /**
                 * @type {Array}
                 */
                this.orders = null;
                /**
                 * @type {boolean}
                 */
                this.pending = true;

                this.syncSettings({
                    _assetIdPair: 'dex.assetIdPair'
                });

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
                    },
                    {
                        id: 'controls',
                        templatePath: 'modules/dex/directives/dexMyOrders/header-control-cell.html',
                        scopeData: {
                            cancelAllOrders: this.cancelAllOrders.bind(this)
                        }
                    }
                ];

                this.statusMap = {
                    Cancelled: 'matcher.orders.statuses.canceled',
                    Accepted: 'matcher.orders.statuses.opened',
                    Filled: 'matcher.orders.statuses.filled',
                    PartiallyFilled: 'matcher.orders.statuses.filled'
                };

                const poll = createPoll(this, this._getOrders, 'orders', 1000, { $scope });
                this.observe('_assetIdPair', () => poll.restart());
                poll.ready.then(() => {
                    this.pending = false;
                });
            }

            cancelAllOrders() {
                this.orders.filter(tsUtils.contains({ isActive: true })).forEach((order) => {
                    this.dropOrder(order);
                });
            }

            /**
             * @param order
             */
            dropOrder(order) {
                return ds.cancelOrder(order.amount.asset.id, order.price.asset.id, order.id)
                    .then(() => {
                        const canceledOrder = tsUtils.find(this.orders, { id: order.id });
                        canceledOrder.state = 'Canceled';
                        notification.info({
                            ns: 'app.dex',
                            title: { literal: 'directives.myOrders.notifications.isCanceled' }
                        });

                        $scope.$digest();
                    })
                    .catch(() => {
                        notification.error({
                            ns: 'app.dex',
                            title: { literal: 'directives.myOrders.notifications.somethingWentWrong' }
                        });
                    });
            }

            /**
             * @returns {Promise}
             * @private
             */
            _getOrders() {
                return waves.matcher.getOrders()
                    .then((orders) => orders.filter(tsUtils.contains({ isActive: true })));
            }

        }

        return new DexMyOrders();
    };

    controller.$inject = [
        'Base',
        'waves',
        'user',
        'createPoll',
        'notification',
        'utils',
        '$scope'
    ];

    angular.module('app.dex').component('wDexMyOrders', {
        bindings: {},
        templateUrl: 'modules/dex/directives/dexMyOrders/myOrders.html',
        controller
    });
})();

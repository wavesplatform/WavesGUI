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
        $scope,
        orderStatuses
    ) {

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
                        sort: true
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

                const poll = createPoll(this, this._getOrders, 'orders', 3000, { $scope });
                this.observe('_assetIdPair', () => poll.restart());
            }

            cancelAllOrders() {
                this.orders.filter(DexMyOrders._isStatusOpen).forEach((order) => {
                    this.dropOrder(order);
                });
            }

            /**
             * @param order
             */
            dropOrder(order) {
                user.getSeed().then((seed) => {
                    waves.matcher.cancelOrder(order.amount.asset.id, order.price.asset.id, order.id, seed.keyPair)
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
                });
            }

            /**
             * @returns {Promise}
             * @private
             */
            _getOrders() {
                return user.getSeed()
                    .then((seed) => waves.matcher.getOrders(seed.keyPair))
                    .then((orders) => {
                        const active = [];
                        const others = [];

                        orders.forEach((order) => {
                            switch (order.status) {
                                case 'Accepted':
                                    active.push(order);
                                    break;
                                case 'PartiallyFilled':
                                    active.push(order);
                                    break;
                                default:
                                    others.push(order);
                            }
                        });

                        active.sort(utils.comparators.process(({ timestamp }) => timestamp).desc);
                        others.sort(utils.comparators.process(({ timestamp }) => timestamp).desc);

                        return active.concat(others);
                    });
            }

            /**
             * @param order
             * @param anotherOrder
             * @returns {number}
             * @private
             */
            static _compareStatusAscending(order, anotherOrder) {
                // todo: стабилизация в этом случае работает плохо.
                // todo: алгоритм требует уточнения и переработки.
                if (DexMyOrders._isStatusOpen(order) && DexMyOrders._isStatusOpen(anotherOrder)) {
                    return 0;
                }

                if (DexMyOrders._isStatusOpen(order) && DexMyOrders._isStatusClosed(anotherOrder)) {
                    return -1;
                }

                if (DexMyOrders._isStatusClosed(order) && DexMyOrders._isStatusOpen(anotherOrder)) {
                    return 1;
                }

                if (DexMyOrders._isStatusClosed(order) && DexMyOrders._isStatusClosed(anotherOrder)) {
                    return 0;
                }
            }

            /**
             * @type StatusChecker
             */
            static _isStatusOpen({ status }) {
                return status === orderStatuses.accepted || status === orderStatuses.partiallyFilled;
            }

            /**
             * @type StatusChecker
             */
            static _isStatusClosed({ status }) {
                return status === orderStatuses.filled || status === orderStatuses.cancelled;
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
        '$scope',
        'orderStatuses'
    ];

    angular.module('app.dex').component('wDexMyOrders', {
        bindings: {},
        templateUrl: 'modules/dex/directives/dexMyOrders/myOrders.html',
        controller
    });
})();

/**
 * @typedef {function} ColumnDataBuilder
 * @param {string} name
 * @returns {
 *  {
 *      name: string,
 *      compareStabilizing: Comparator,
 *      compareAscending: Comparator,
 *      compareDescending: Comparator
 *  }
 * }
 * @private
 */

/**
 * @typedef {function} StatusChecker
 * @returns {boolean}
 * @private
 */

/**
 * @typedef {function} Comparator
 * @param {string} field
 * @returns {function(*, *): number}
 * @private
 */

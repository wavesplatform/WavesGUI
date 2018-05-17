(function () {
    'use strict';

    const COMPARATORS = {
        ASCENDING: 'asc',
        DESCENDING: 'desc'
    };

    /**
     * @param Base
     * @param {Waves} waves
     * @param {User} user
     * @param {IPollCreate} createPoll
     * @param {INotification} notification
     * @param {app.utils} utils
     * @param {$rootScope.Scope} $scope
     * @param orderStatuses
     * @param Sortable
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
        orderStatuses,
        Sortable
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

                /**
                 * @type {Array}
                 */
                this.filteredOrders = null;

                this.columns = new Sortable.Columns([
                    ...['type', 'timestamp'].map(DexMyOrders._getSortingColumn),
                    ...['price', 'amount', 'total'].map(DexMyOrders._getSortingMoneyColumn),
                    DexMyOrders._getSortingStatusColumn('status')
                ]);

                this.mask = '';

                this.syncSettings({
                    _assetIdPair: 'dex.assetIdPair'
                });

                const poll = createPoll(this, this._getOrders, this._setOrders, 5000, { $scope });
                this.observe('_assetIdPair', () => poll.restart());
            }

            applyFilter() {
                this.filteredOrders = this.orders.filter((order) => {
                    const pair = order.pair.toLowerCase();
                    const mask = this.mask.toLowerCase();

                    return pair.includes(mask);
                });
            }

            /**
             * @param columnName
             */
            sortBy(columnName) {
                this.columns.sortBy(columnName, this.orders);
                this.applyFilter();
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

                        return this.columns.applyCurrentSort(active.concat(others));
                    });
            }

            _setOrders(orders) {
                this.orders = orders;
                this.applyFilter();
            }

            /**
             * @type ColumnDataBuilder
             */
            static _getSortingColumn(name) {
                return {
                    ...DexMyOrders._getTimeStabilizingColumn(name),
                    compareAscending: DexMyOrders._getAscendingComparator(name),
                    compareDescending: DexMyOrders._getDescendingComparator(name)
                };
            }

            /**
             * @type ColumnDataBuilder
             */
            static _getSortingMoneyColumn(name) {
                return {
                    ...DexMyOrders._getTimeStabilizingColumn(name),
                    compareAscending: DexMyOrders._getAscendingMoneyComparator(name),
                    compareDescending: DexMyOrders._getDescendingMoneyComparator(name)
                };
            }

            /**
             * @type ColumnDataBuilder
             */
            static _getSortingStatusColumn(name) {
                return {
                    ...DexMyOrders._getTimeStabilizingColumn(name),
                    compareAscending: DexMyOrders._compareStatusAscending,
                    compareDescending(order, anotherOrder) {
                        return -1 * DexMyOrders._compareStatusAscending(order, anotherOrder);
                    }
                };
            }

            /**
             * @param name
             * @returns {{name: *, compareStabilizing: Comparator}}
             * @private
             */
            static _getTimeStabilizingColumn(name) {
                return {
                    name,
                    compareStabilizing: DexMyOrders._getDescendingComparator('timestamp')
                };
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

            /**
             * @type Comparator
             */
            static _getAscendingComparator(field) {
                return DexMyOrders._getComparator({
                    type: COMPARATORS.ASCENDING,
                    field
                });
            }

            /**
             * @type Comparator
             */
            static _getDescendingComparator(field) {
                return DexMyOrders._getComparator({
                    type: COMPARATORS.DESCENDING,
                    field
                });
            }

            /**
             * @type Comparator
             */
            static _getAscendingMoneyComparator(field) {
                return DexMyOrders._getMoneyComparator({
                    type: COMPARATORS.ASCENDING,
                    field
                });
            }

            /**
             * @type Comparator
             */
            static _getDescendingMoneyComparator(field) {
                return DexMyOrders._getMoneyComparator({
                    type: COMPARATORS.DESCENDING,
                    field
                });
            }

            /**
             * @param type
             * @param field
             * @returns {function(*, *): number}
             * @private
             */
            static _getMoneyComparator({ type, field }) {
                return DexMyOrders._getComparator({
                    type,
                    field,
                    comparators: utils.comparators.money
                });
            }

            /**
             * @param type
             * @param field
             * @param comparators
             * @returns {function(*, *): number}
             * @private
             */
            static _getComparator({ type, field, comparators = utils.comparators }) {
                return (order, anotherOrder) => comparators[type](order[field], anotherOrder[field]);
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
        'orderStatuses',
        'Sortable'
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

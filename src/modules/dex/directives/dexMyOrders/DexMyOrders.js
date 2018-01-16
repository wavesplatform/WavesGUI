(function () {
    'use strict';

    /**
     * @param Base
     * @param {Waves} waves
     * @param {User} user
     * @param createPoll
     * @param {NotificationManager} notificationManager
     * @param {app.utils} utils
     * @return {DexMyOrders}
     */
    const controller = function (Base, waves, user, createPoll, notificationManager, utils) {

        class DexMyOrders extends Base {

            constructor() {
                super();

                /**
                 * @type {{amount: string, price: string}}
                 * @private
                 */
                this._assetIdPair = null;

                this.syncSettings({
                    _assetIdPair: 'dex.assetIdPair'
                });

                const poll = createPoll(this, this._getOrders, 'orders', 5000);
                this.observe('_assetIdPair', () => poll.restart());
            }

            dropOrder(order) {
                user.getSeed().then((seed) => {
                    waves.matcher.cancelOrder(order.amount.asset.id, order.price.asset.id, order.id, seed.keyPair)
                        .then(() => {
                            const canceledOrder = tsUtils.find(this.orders, { id: order.id });
                            canceledOrder.state = 'Canceled';
                            notificationManager.info({
                                ns: 'app.dex',
                                title: { literal: 'directives.myOrders.notifications.isCanceled' }
                            });
                        })
                        .catch(() => {
                            notificationManager.error({
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

        }

        return new DexMyOrders();
    };

    controller.$inject = ['Base', 'waves', 'user', 'createPoll', 'notificationManager', 'utils'];

    angular.module('app.dex').component('wDexMyOrders', {
        bindings: {},
        templateUrl: 'modules/dex/directives/dexMyOrders/myOrders.html',
        controller
    });
})();

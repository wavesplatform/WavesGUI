(function () {
    'use strict';

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {IPollCreate} createPoll
     * @param {Waves} waves
     * @return {MyBalance}
     */
    const controller = function (Base, $scope, createPoll, waves) {

        class MyBalance extends Base {

            constructor() {
                super();
                /**
                 * @type {Array}
                 */
                this.balanceList = null;
                this.headers = [
                    {
                        id: 'asset',
                        search: true,
                        sort: true,
                        valuePath: 'item.asset.displayName'
                    },
                    {
                        id: 'available',
                        sort: true,
                        title: { literal: 'directives.balance.available' },
                        valuePath: 'item.available'
                    },
                    {
                        id: 'inOrders',
                        sort: true,
                        title: { literal: 'directives.balance.inOrders' },
                        valuePath: 'item.inOrders'
                    },
                    {
                        id: 'total',
                        sort: true,
                        title: { literal: 'directives.balance.total' },
                        valuePath: 'item.regular'
                    }
                ];

                const isBalance = true;
                createPoll(this, this._getBalanceList, 'balanceList', 1000, { $scope, isBalance });
            }

            /**
             * @return {Promise<IBalanceDetails[]>}
             * @private
             */
            _getBalanceList() {
                return waves.node.assets.userBalances();
            }

        }

        return new MyBalance();
    };

    controller.$inject = ['Base', '$scope', 'createPoll', 'waves'];

    angular.module('app.dex').component('wDexMyBalance', {
        bindings: {},
        templateUrl: 'modules/dex/directives/myBalance/myBalance.html',
        transclude: false,
        controller
    });
})();

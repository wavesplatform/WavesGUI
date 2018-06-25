(function () {
    'use strict';

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {IPollCreate} createPoll
     * @param {Waves} waves
     * @param {User} user
     * @param {ModalManager} modalManager
     * @return {MyBalance}
     */
    const controller = function (Base, $scope, createPoll, waves, user, modalManager) {

        const R = require('ramda');

        class MyBalance extends Base {

            constructor() {
                super();
                /**
                 * @type {Array}
                 */
                this.balanceList = null;
                this.isDemo = !user.address;
                this.pending = !this.isDemo;
                this.headers = [
                    {
                        id: 'asset',
                        search: true,
                        sort: true,
                        valuePath: 'item.asset.displayName'
                    },
                    {
                        id: 'assetId',
                        sort: false,
                        title: { literal: 'directives.balance.assetId' },
                        valuePath: 'item.assetId'
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
                        title: { literal: 'directives.balance.inOrdersFull' },
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

                if (!this.isDemo) {
                    createPoll(this, this._getBalanceList, 'balanceList', 1000, { $scope, isBalance }).ready
                        .then(() => {
                            this.pending = false;
                        });
                }
            }

            showAssetInfo(asset) {
                return modalManager.showAssetInfo(asset);
            }

            /**
             * @param {string} assetId
             */
            setPair(assetId) {
                const wavesId = WavesApp.defaultAssets.WAVES;
                const btcId = WavesApp.defaultAssets.BTC;
                const assetId2 = assetId === wavesId ? btcId : wavesId;

                ds.api.pairs.get(assetId, assetId2).then((pair) => {
                    user.setSetting('dex.assetIdPair', {
                        amount: pair.amountAsset.id,
                        price: pair.priceAsset.id
                    });
                });
            }

            /**
             * @return {Promise<IBalanceDetails[]>}
             * @private
             */
            _getBalanceList() {
                return waves.node.assets.userBalances()
                    .then(R.filter(MyBalance._isNotScam()));
            }

            /**
             * @private
             */
            static _isNotScam() {
                const spamHash = (user.getSetting('wallet.portfolio.spam') || [])
                    .reduce((r, id) => {
                        r[id] = true;
                        return r;
                    }, Object.create(null));
                return (item) => {
                    return !WavesApp.scam[item.asset.id] && !spamHash[item.asset.id];
                };
            }

        }

        return new MyBalance();
    };

    controller.$inject = ['Base', '$scope', 'createPoll', 'waves', 'user', 'modalManager'];

    angular.module('app.dex').component('wDexMyBalance', {
        bindings: {},
        templateUrl: 'modules/dex/directives/myBalance/myBalance.html',
        transclude: false,
        controller
    });
})();

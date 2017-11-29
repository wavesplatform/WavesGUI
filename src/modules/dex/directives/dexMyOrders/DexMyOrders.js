(function () {
    'use strict';

    /**
     * @param Base
     * @param {Waves} waves
     * @param {User} user
     * @return {DexMyOrders}
     */
    const controller = function (Base, waves, user, createPoll) {

        class DexMyOrders extends Base {

            constructor() {
                super();

                /**
                 * @type {string}
                 * @private
                 */
                this._amountAssetId = null;
                /**
                 * @type {string}
                 * @private
                 */
                this._priceAssetId = null;

                this.syncSettings({
                    _amountAssetId: 'dex.amountAssetId',
                    _priceAssetId: 'dex.priceAssetId'
                });

                const poll = createPoll(this, this._getOrders, 'orders', 5000);
                this.observe(['_amountAssetId', '_priceAssetId'], () => poll.restart());
            }

            _getOrders() {
                const asset1 = this._priceAssetId;
                const asset2 = this._amountAssetId;
                return Promise.all([user.getSeed(), Waves.AssetPair.get(asset1, asset2)])
                    .then(([seed, pair]) => waves.matcher.getOrdersByPair(pair.amountAsset.id, pair.priceAsset.id, seed.keyPair));
            }

        }

        return new DexMyOrders();
    };

    controller.$inject = ['Base', 'waves', 'user', 'createPoll'];

    angular.module('app.dex').component('wDexMyOrders', {
        bindings: {},
        templateUrl: 'modules/dex/directives/dexMyOrders/myOrders.html',
        controller
    });
})();

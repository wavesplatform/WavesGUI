(function () {
    'use strict';

    /**
     * @param {User} user
     * @param {app.utils.decorators} decorators
     * @param {Waves} waves
     * @return {BaseAssetService}
     */
    const factory = function (user, decorators, waves) {

        class BaseAssetService {

            getBaseAsset() {
                return waves.node.assets.getAsset(user.getSetting('baseAssetId'));
            }

            convertToBaseAsset(money) {
                return this.getBaseAsset().then((baseAsset) => {
                    // TODO : change to getRateByDate()
                    return waves.utils.getRateApi(money.asset.id, baseAsset.id)
                        .then((api) => api.exchange(money.getTokens()))
                        .then((balance) => ds.moneyFromTokens(balance, baseAsset));
                });
            }

        }

        return new BaseAssetService();
    };

    factory.$inject = ['user', 'decorators', 'waves'];

    angular.module('app.utils').factory('baseAssetService', factory);
})();

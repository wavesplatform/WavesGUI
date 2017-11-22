(function () {
    'use strict';

    /**
     * @param {app.utils.apiWorker} apiWorker
     * @param {User} user
     * @param {app.utils.decorators} decorators
     * @param {AssetsService} assetsService
     * @return {BaseAssetService}
     */
    const factory = function (apiWorker, user, decorators, assetsService) {

        class BaseAssetService {

            @decorators.cachable()
            getBaseAsset() {
                return assetsService.getAssetInfo(user.getSetting('baseAssetId'));
            }

            convertToBaseAsset(money) {
                return this.getBaseAsset().then((baseAsset) => {
                    // TODO : change to getRateByDate()
                    return assetsService.getRate(money.asset.id, baseAsset.id)
                        .then((api) => api.exchange(money.getTokens()))
                        .then((balance) => {
                            return apiWorker.process((Waves, { tokens, baseAsset }) => {
                                return Waves.Money.fromTokens(tokens, baseAsset)
                                    .then((money) => {
                                        // Some names are overwritten in the client
                                        money.asset.name = baseAsset.name;
                                        return money;
                                    });
                            }, { tokens: balance.toFormat(), baseAsset });
                        });
                });
            }

        }

        return new BaseAssetService();
    };

    factory.$inject = ['apiWorker', 'user', 'decorators', 'assetsService'];

    angular.module('app.utils').factory('baseAssetService', factory);
})();

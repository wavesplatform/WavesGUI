(function () {
    'use strict';

    /**
     * @param {AssetsService} assetsService
     * @param utils
     * @param {User} user
     * @return {DexCtrl}
     */
    const controller = function (assetsService, utils, user, Base) {

        class DexCtrl extends Base {

            constructor() {
                super();

                this.amountAssetId = null;
                this.priceAssetId = null;
                this.syncSettings([
                    'dex.amountAssetId',
                    'dex.priceAssetId'
                ]);

                this._initialize();
            }

            _initialize() {
                const promises = Object.values(WavesApp.defaultAssets)
                    .map(assetsService.getBalance);

                utils.when(Promise.all(promises))
                    .then((assets) => {
                        this.portfolioAssets = assets;
                    });
            }

        }

        return new DexCtrl();
    };


    controller.$inject = ['assetsService', 'utils', 'user', 'Base'];

    angular.module('app.dex')
        .controller('DexCtrl', controller);
})();

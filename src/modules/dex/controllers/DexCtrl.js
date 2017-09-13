(function () {
    'use strict';

    /**
     * @param {AssetsService} assetsService
     * @param utils
     * @param {User} user
     * @return {DexCtrl}
     */
    const controller = function (assetsService, utils, user) {

        class DexCtrl {

            constructor() {

                const promises = Object.values(WavesApp.defaultAssets)
                    .map(assetsService.getBalance);

                utils.when(Promise.all(promises))
                    .then((assets) => {
                        this.portfolioAssets = assets;
                    });

                user.getSetting('dex.amountAssetId')
                    .then(assetsService.getAssetInfo)
                    .then((info) => {
                        this.amountAsset = info;
                    });

                user.getSetting('dex.priceAssetId')
                    .then(assetsService.getAssetInfo)
                    .then((info) => {
                        this.priceAsset = info;
                    });

                this.orders = {
                    by: [
                        { size: 162.43500787, price: 0.0000925 },
                        { size: 110, price: 0.0000909 },
                        { size: 54.4, price: 0.00009084 },
                        { size: 2, price: 0.00000004 }
                    ],
                    sell: [
                        { size: 162.43500787, price: 0.0000925 },
                        { size: 110, price: 0.0000909 },
                        { size: 54.4, price: 0.00009084 },
                        { size: 2, price: 0.00000004 }
                    ]
                };
            }

        }

        return new DexCtrl();
    };


    controller.$inject = ['assetsService', 'utils', 'user'];

    angular.module('app.dex')
        .controller('DexCtrl', controller);
})();

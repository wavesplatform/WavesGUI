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
            }

        }

        return new DexCtrl();
    };


    controller.$inject = ['assetsService', 'utils', 'user', 'Base'];

    angular.module('app.dex')
        .controller('DexCtrl', controller);
})();

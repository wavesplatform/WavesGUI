(function () {
    'use strict';

    const controller = function ($mdDialog) {

        class AssetInfoCtr {

            constructor(asset) {
                this.asset = asset;
            }

            cancel() {
                $mdDialog.cancel();
            }

        }

        return new AssetInfoCtr(this.asset);
    };

    controller.$inject = ['$mdDialog'];

    angular.module('app.wallet.assets').controller('AssetInfoCtr', controller);
})();

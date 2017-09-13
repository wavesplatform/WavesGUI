(function () {
    'use strict';

    const controller = function ($mdDialog) {

        class AssetSendCtrl {

            constructor(asset) {
                this.asset = asset;
            }

            cancel() {
                $mdDialog.cancel();
            }

        }

        return new AssetSendCtrl(this.asset);
    };

    controller.$inject = ['$mdDialog'];

    angular.module('app.wallet.assets').controller('AssetSendCtrl', controller);
})();

(function () {
    'use strict';

    const controller = function ($mdDialog) {

        class AssetReceiveCtrl {

            constructor(asset) {
                this.asset = asset;
                this.step = 0;
            }

            cancel() {
                $mdDialog.cancel();
            }

            ok() {
                this.step++;
            }

        }

        return new AssetReceiveCtrl(this.asset);
    };

    controller.$inject = ['$mdDialog'];

    angular.module('app.wallet.assets')
        .controller('AssetReceiveCtrl', controller);
})();

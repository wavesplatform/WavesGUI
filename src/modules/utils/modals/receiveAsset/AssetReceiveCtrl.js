(function () {
    'use strict';

    /**
     * @param $mdDialog
     * @param Base
     * @param $scope
     * @param {AssetsService} assetsService
     * @return {AssetReceiveCtrl}
     */
    const controller = function ($mdDialog, Base, $scope, assetsService) {

        class AssetReceiveCtrl extends Base {

            constructor({ assetId, canChooseAsset }) {
                super($scope);

                this.observe('assetId', this._onChangeAssetId);

                this.assetId = assetId || WavesApp.defaultAssets.WAVES;
                this.asset = null;
                this.canChooseAsset = !assetId || canChooseAsset;
                this.step = 0;
            }

            _onChangeAssetId() {
                assetsService.getAssetInfo(this.assetId).then((asset) => {
                    this.asset = asset;
                });
            }

            cancel() {
                $mdDialog.cancel();
            }

            ok() {
                this.step++;
            }

        }

        return new AssetReceiveCtrl(this);
    };

    controller.$inject = ['$mdDialog', 'Base', '$scope', 'assetsService'];

    angular.module('app.utils')
        .controller('AssetReceiveCtrl', controller);
})();

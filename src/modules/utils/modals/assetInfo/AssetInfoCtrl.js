(function () {
    'use strict';

    const controller = function (Base, $scope, user) {

        class AssetInfoCtrl extends Base {

            constructor(asset) {
                super($scope);
                this.asset = asset;
                this.wavesId = WavesApp.defaultAssets.WAVES;

                const assetList = user.getSetting('pinnedAssetIds');
                this.assetList = assetList;
                this.pinned = assetList.indexOf(asset.id) !== -1;
            }

            togglePin() {
                this.assetList = this.assetList.filter(tsUtils.notContains(this.asset.id));
                if (!this.pinned) {
                    this.assetList = this.assetList.concat(this.asset.id);
                }
                this.pinned = !this.pinned;
                user.setSetting('pinnedAssetIds', this.assetList);
            }

        }

        return new AssetInfoCtrl(this.locals);
    };

    controller.$inject = ['Base', '$scope', 'user'];

    angular.module('app.ui').controller('AssetInfoCtrl', controller);
})();

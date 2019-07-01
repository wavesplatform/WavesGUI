(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param user
     * @param waves
     * @param utils
     * @param createPoll
     * @return {AssetInfoHead}
     */
    const controller = function (Base, $scope, user, waves, utils, createPoll) {

        class AssetInfoHead extends Base {

            /**
             * @type {string}
             */
            assetName;
            /**
             * @type {boolean}
             */
            ratingError = false;

            $postLink() {
                this._getAssetInfo();
                this.observe('assetId', this._getAssetInfo);
                createPoll(this, this._getTokenRating, this._setTokenRating, 60 * 1000);
            }

            /**
             * @private
             */
            _getAssetInfo() {
                waves.node.assets.getAsset(this.assetId).then(asset => {
                    this.assetName = asset.name;
                    this.ticker = asset.ticker;
                    const { hasLabel, isGateway } = utils.getDataFromOracles(asset.id);
                    this.hasLabel = hasLabel;
                    this.isGatewayOrWaves = this.assetId === WavesApp.defaultAssets.WAVES ||
                        isGateway &&
                        this.assetId !== WavesApp.defaultAssets.VST &&
                        this.assetId !== WavesApp.defaultAssets.ERGO;
                    $scope.$apply();
                });

                this.state = { assetId: this.assetId };
            }

            _getTokenRating() {
                return ds.api.rating.getAssetsRating(this.assetId)
                    .then(assetList => assetList);
            }

            _setTokenRating(asset) {
                if (!asset) {
                    return null;
                }
                if (!Array.isArray(asset)) {
                    this.ratingError = true;
                    return null;
                }
                this.ratingError = false;
                this.rating = asset.rating;
                $scope.$apply();
            }

        }

        return new AssetInfoHead();
    };

    controller.$inject = ['Base', '$scope', 'user', 'waves', 'utils', 'createPoll'];

    angular.module('app.ui')
        .component('wAssetInfoHead', {
            controller: controller,
            templateUrl: 'modules/ui/directives/assetInfoHead/asset-info-head.html',
            bindings: {
                assetId: '<'
            }
        });
})();

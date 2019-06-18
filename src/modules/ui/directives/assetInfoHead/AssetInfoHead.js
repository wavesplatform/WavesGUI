(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param user
     * @param waves
     * @param utils
     * @return {AssetInfoHead}
     */
    const controller = function (Base, $scope, user, waves, utils, createPoll) {

        class AssetInfoHead extends Base {

            /**
             * @type {string}
             */
            assetName;

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
                    const { hasLabel } = utils.getDataFromOracles(asset.id);
                    this.hasLabel = hasLabel;
                    $scope.$apply();
                });

                this.state = { assetId: this.assetId };
            }

            _getTokenRating() {
                // return ds.fetch(`https://tokenrating.wavesexplorer.com/api/v1/token/${this.assetId}`);
                return ds.api.rating.getAssetsRating(this.assetId);
            }

            _setTokenRating([rating]) {
                if (!rating) {
                    return null;
                }
                this.rating = rating;
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

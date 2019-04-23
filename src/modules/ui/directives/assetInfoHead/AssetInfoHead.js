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
    const controller = function (Base, $scope, user, waves, utils) {

        class AssetInfoHead extends Base {

            /**
             * @param {object}
             * @type {{this}}
             */
            state;
            /**
             * @type {Signable}
             */
            signable;
            /**
             * @type {number}
             */
            step = 0;
            /**
             * @type {boolean}
             */
            isVerified;
            /**
             * @type {boolean}
             */
            isGateway;
            /**
             * @type {boolean}
             */
            isSuspicious;
            /**
             * @type {string}
             */
            assetName;

            $postLink() {
                this._getAssetInfo();
                this.observe('assetId', this._getAssetInfo);
            }

            /**
             * @private
             */
            _getAssetInfo() {
                waves.node.assets.getAsset(this.assetId).then(asset => {
                    this.assetName = asset.displayName;
                    this.ticker = asset.ticker;
                    const {
                        isVerified,
                        isGateway,
                        isTokenomica,
                        isSuspicious,
                        hasLabel
                    } = utils.getDataFromOracles(asset.id);
                    this.isVerified = isVerified;
                    this.isGateway = isGateway;
                    this.isTokenomica = isTokenomica;
                    this.isSuspicious = isSuspicious;
                    this.hasLabel = hasLabel;
                    $scope.$apply();
                });

                this.state = { assetId: this.assetId };
            }

        }

        return new AssetInfoHead();
    };

    controller.$inject = ['Base', '$scope', 'user', 'waves', 'utils'];

    angular.module('app.ui')
        .component('wAssetInfoHead', {
            controller: controller,
            templateUrl: 'modules/ui/directives/assetInfoHead/asset-info-head.html',
            bindings: {
                assetId: '<'
            }
        });
})();

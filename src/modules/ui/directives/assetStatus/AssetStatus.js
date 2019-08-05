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
             * @public
             * @type string
             */
            size = 'medium';
            /**
             * @public
             * @type boolean
             */
            onlySpam = false;
            /**
             * @public
             * @type string
             */
            assetId;

            $postLink() {
                this._getAssetInfo();
                this.observe('assetId', this._getAssetInfo);
            }

            /**
             * @private
             */
            _getAssetInfo() {
                const {
                    isVerified,
                    isGateway,
                    isTokenomica,
                    isSuspicious,
                    isGatewaySoon,
                    hasLabel
                } = utils.getDataFromOracles(this.assetId);
                this.isGateway = isGateway;
                this.isTokenomica = isGateway ? false : isTokenomica;
                this.isVerified = isTokenomica ? false : isVerified;
                this.isSuspicious = isVerified ? false : isSuspicious;
                this.isGatewaySoon = isGateway ? false : isGatewaySoon;
                this.hasLabel = hasLabel;
            }

        }

        return new AssetInfoHead();
    };

    controller.$inject = ['Base', '$scope', 'user', 'waves', 'utils'];

    angular.module('app.ui')
        .component('wAssetStatus', {
            controller: controller,
            templateUrl: 'modules/ui/directives/assetStatus/asset-status.html',
            bindings: {
                assetId: '<',
                size: '<',
                onlySpam: '<'
            }
        });
})();

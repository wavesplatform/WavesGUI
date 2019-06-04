(function () {
    'use strict';

    // TODO: delete after contest
    const CONTEST_ASSET_ID_LIST = [
        'D4pFweACmYsfatwsQjGCeXcwnaphURLm2XTg5GNh1rjQ'
    ];
    // TODO: delete after contest

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
                // TODO: delete when gateway will be ready
                this.isGatewaySoon = isGatewaySoon;
                this.isTokenomica = isGateway ? false : isTokenomica;
                this.isVerified = isTokenomica ? false : isVerified;
                this.isSuspicious = isVerified ? false : isSuspicious;
                this.hasLabel = hasLabel;

                // TODO: delete after contest
                if (CONTEST_ASSET_ID_LIST.indexOf(this.assetId) > -1) {
                    this.isContest = true;
                }
                // TODO: delete after contest
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
                assetId: '<'
            }
        });
})();

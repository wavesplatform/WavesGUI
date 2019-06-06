(function () {
    'use strict';

    // TODO: delete after contest
    const CONTEST_ASSET_ID_LIST = [
        'Gsj1azEwNuUTss5FHLPbgR6FGya284Q843tCrrFgi4VZ',
        'JCm9j4nBQ8tXE2kRKzhgoV6jqVm1QC3FeXLcKwsLdRyG',
        'HjcJSVFeo34WD1QFFonRa3boQAkRLZxCdURJU73Ffcga',
        'F33CKa4cPB9fK5oA3aUZKAtDJtdohvEzX84Hkwthep5V'
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

            /**
             * @type {string}
             */
            assetName;

            $postLink() {
                this._getAssetInfo();
                this.observe('assetId', this._getAssetInfo);

                // TODO: delete after contest
                this.isContestAsset = CONTEST_ASSET_ID_LIST.indexOf(this.assetId) > -1;
                // TODO: delete after contest
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

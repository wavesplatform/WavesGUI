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

            $postLink() {
                this._getAssetInfo();
                this.observe('assetId', this._getAssetInfo);
            }

            stopPropagation(e) {
                e.stopPropagation();
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
                    hasLabel
                } = utils.getDataFromOracles(this.assetId);
                this.isGateway = isGateway;
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

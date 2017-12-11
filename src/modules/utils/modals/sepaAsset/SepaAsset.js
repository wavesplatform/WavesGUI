(function () {
    'use strict';

    /**
     * @param $mdDialog
     * @param Base
     * @param $scope
     * @param {GatewayService} gatewayService
     * @return {SepaAsset}
     */
    const controller = function ($mdDialog, Base, $scope, gatewayService) {

        class SepaAsset extends Base {

            constructor({ address, asset }) {
                super($scope);
                /**
                 * @type {string}
                 */
                this.address = address;
                /**
                 * @type {Asset}
                 */
                this.asset = asset;
                /**
                 * @type {string}
                 */
                this.assetKeyName = gatewayService.getAssetKeyName(asset, 'sepa');
                /**
                 * @type {string}
                 */
                this.listOfEligibleCountries = null;
                /**
                 * @type {string}
                 */
                this.idNowSiteUrl = null;
                /**
                 * @type {string}
                 */
                this.idNowUserLink = null;

                gatewayService.getSepaDetails(asset, address).then((details) => {
                    this.listOfEligibleCountries = details.listOfEligibleCountries;
                    this.idNowSiteUrl = details.idNowSiteUrl;
                    this.idNowUserLink = details.idNowUserLink;
                });
            }

        }

        return new SepaAsset(this.locals);
    };

    controller.$inject = ['$mdDialog', 'Base', '$scope', 'gatewayService'];

    angular.module('app.utils').controller('SepaAsset', controller);
})();

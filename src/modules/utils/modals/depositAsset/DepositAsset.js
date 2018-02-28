(function () {
    'use strict';

    /**
     * @param $mdDialog
     * @param Base
     * @param $scope
     * @param {GatewayService} gatewayService
     * @return {DepositAsset}
     */
    const controller = function ($mdDialog, Base, $scope, gatewayService) {

        class DepositAsset extends Base {

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
                this.assetKeyName = gatewayService.getAssetKeyName(asset, 'deposit');
                /**
                 * @type {string}
                 */
                this.gatewayAddress = null;

                gatewayService.getDepositDetails(asset, address).then((details) => {
                    this.gatewayAddress = details.address;
                });
            }

        }

        return new DepositAsset(this.locals);
    };

    controller.$inject = ['$mdDialog', 'Base', '$scope', 'gatewayService'];

    angular.module('app.utils').controller('DepositAsset', controller);
})();

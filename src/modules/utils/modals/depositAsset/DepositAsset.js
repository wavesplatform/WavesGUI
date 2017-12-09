(function () {
    'use strict';

    /**
     * @param $mdDialog
     * @param Base
     * @param $scope
     * @param {CoinomatService} coinomatService
     * @return {DepositAsset}
     */
    const controller = function ($mdDialog, Base, $scope, coinomatService) {

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
                this.assetKeyName = coinomatService.getKeyNameFor(asset);
                /**
                 * @type {string}
                 */
                this.gatewayAddress = null;

                coinomatService.getDepositDetails(asset, address).then((details) => {
                    this.gatewayAddress = details.address;
                });
            }

        }

        return new DepositAsset(this.locals);
    };

    controller.$inject = ['$mdDialog', 'Base', '$scope', 'coinomatService'];

    angular.module('app.utils').controller('DepositAsset', controller);
})();

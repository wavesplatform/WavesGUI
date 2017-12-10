(function () {
    'use strict';

    /**
     * @param {GatewayService} gatewayService
     * @return {Asset}
     */
    const controller = function (gatewayService) {

        class Asset {

            constructor() {
                /**
                 * @type {Money}
                 */
                this.balance = null;
                /**
                 * @type {boolean}
                 */
                this.isDepositSupported = false;
            }

            $postLink() {
                this.isDepositSupported = gatewayService.hasSupportOf(this.balance.asset, 'deposit');
            }

        }

        return new Asset();
    };

    controller.$inject = ['gatewayService'];

    angular.module('app.wallet.assets').component('wAsset', {
        bindings: {
            balance: '<',
            onClick: '&'
        },
        templateUrl: 'modules/wallet/modules/assets/directives/asset/asset.html',
        controller
    });
})();

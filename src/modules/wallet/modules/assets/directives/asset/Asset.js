(function () {
    'use strict';

    /**
     * @param {GatewayService} gatewayService
     * @param {Waves} waves
     * @return {Asset}
     */
    const controller = function (gatewayService, waves) {

        class Asset {

            constructor() {
                /**
                 * @type {IBalanceDetails}
                 */
                this.balance = null;
                /**
                 * @type {boolean}
                 */
                this.isDepositSupported = false;
                /**
                 * @type {boolean}
                 */
                this.isSepaSupported = false;
            }

            $postLink() {
                this.isDepositSupported = gatewayService.hasSupportOf(this.balance.asset, 'deposit');
                this.isSepaSupported = gatewayService.hasSupportOf(this.balance.asset, 'sepa');
            }

        }

        return new Asset();
    };

    controller.$inject = ['gatewayService', 'waves'];

    angular.module('app.wallet.assets').component('wAsset', {
        bindings: {
            balance: '<',
            onClick: '&'
        },
        templateUrl: 'modules/wallet/modules/assets/directives/asset/asset.html',
        controller
    });
})();

(function () {
    'use strict';

    /**
     * @param {CoinomatService} coinomatService
     * @return {Asset}
     */
    const controller = function (coinomatService) {

        class Asset {

            constructor() {
                /**
                 * @type {Money}
                 */
                this.balance = null;
                /**
                 * @type {boolean}
                 */
                this.hasGateway = null;
            }

            $postLink() {
                this.hasGateway = coinomatService.hasSupportOf(this.balance.asset);
            }

        }

        return new Asset();
    };

    controller.$inject = ['coinomatService'];

    angular.module('app.wallet.assets').component('wAsset', {
        bindings: {
            balance: '<',
            onClick: '&'
        },
        templateUrl: 'modules/wallet/modules/assets/directives/asset/asset.html',
        controller
    });
})();

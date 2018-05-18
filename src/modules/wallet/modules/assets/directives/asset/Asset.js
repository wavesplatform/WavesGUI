(function () {
    'use strict';

    /**
     * @return {Asset}
     */
    const controller = function () {

        class Asset {

            constructor() {
                /**
                 * @type {IBalanceDetails}
                 */
                this.balance = null;
            }

        }

        return new Asset();
    };

    controller.$inject = [];

    angular.module('app.wallet.assets').component('wAsset', {
        bindings: {
            balance: '<',
            onClick: '&'
        },
        templateUrl: 'modules/wallet/modules/assets/directives/asset/asset.html',
        controller
    });
})();

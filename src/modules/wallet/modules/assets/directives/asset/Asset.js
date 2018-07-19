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

            isUnpinned() {
                return !WavesApp.ALWAYS_PINNED_ASSETS.includes(this.balance.asset.id);
            }

        }

        return new Asset();
    };

    controller.$inject = [];

    angular.module('app.wallet.assets').component('wAsset', {
        bindings: {
            balance: '<',
            onClick: '&',
            onUnpinClick: '&'
        },
        templateUrl: 'modules/wallet/modules/assets/directives/asset/asset.html',
        controller
    });
})();

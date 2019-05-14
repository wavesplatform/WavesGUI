(function () {
    'use strict';

    /**
     * @return {Asset}
     */
    const controller = function (utils) {

        class Asset {

            constructor() {
                /**
                 * @type {IBalanceDetails}
                 */
                this.balance = null;
            }

            $postLink() {
                const { isVerified, isGateway, isTokenomica } = utils.getDataFromOracles(this.balance.asset.id);
                this.isVerified = isVerified;
                this.isGateway = isGateway;
                this.isTokenomica = isTokenomica;
            }

            isUnpinned() {
                return !WavesApp.ALWAYS_PINNED_ASSETS.includes(this.balance.asset.id);
            }

        }

        return new Asset();
    };

    controller.$inject = ['utils'];

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

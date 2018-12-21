(function () {
    'use strict';

    const { path } = require('ramda');
    const ds = require('data-service');
    const { STATUS_LIST } = require('@waves/oracle-data');

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

            $postLink() {
                const data = ds.dataManager.getOracleAssetData(this.balance.asset.id);
                this.isVerified = path(['status'], data) === STATUS_LIST.VERIFIED || this.balance.asset.id === 'WAVES';
                this.isGateway = path(['status'], data) === 3;
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

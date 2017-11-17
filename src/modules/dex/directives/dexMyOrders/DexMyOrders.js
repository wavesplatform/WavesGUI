(function () {
    'use strict';

    const controller = function (Base) {

        class DexMyOrders extends Base {

            constructor() {
                super();

                this._priceAssetId = null;
                this._amountAssetId = null;

                this.syncSettings({
                    _priceAssetId: 'dex.priceAssetId',
                    _amountAssetId: 'dex.amountAssetId'
                });

                this.observe(['_priceAssetId', '_amountAssetId'], this._onChangeBaseAssets);
            }

            _onChangeBaseAssets() {

            }

        }

        return new DexMyOrders();
    };

    controller.$inject = ['Base', ''];

    angular.module('app.dex').component('wDexMyOrders', {
        bindings: {},
        controller
    });
})();

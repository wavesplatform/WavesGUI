(function () {
    'use strict';

    /**
     * @param Base
     * @param {Waves} waves
     * @param {app.utils} utils
     * @return {CreateOrder}
     */
    const controller = function (Base, waves, utils) {

        class CreateOrder extends Base {

            constructor() {
                super();

                this.step = 0;
                this.type = null;

                this.observe(['_amountAssetId', '_priceAssetId'], () => {
                    utils.whenAll([
                        waves.node.assets.info(this._amountAssetId),
                        waves.node.assets.info(this._priceAssetId)
                    ]).then(([ amountAsset, priceAsset ]) => {
                        this.amountAsset = amountAsset;
                        this.priceAsset = priceAsset;
                    });
                });

                this.syncSettings({
                    _amountAssetId: 'dex.amountAssetId',
                    _priceAssetId: 'dex.priceAssetId'
                });
            }

            $postLink() {

            }

            expand(type) {
                this.type = type;
                this.step = 1;
            }

            collapse() {
                this.type = null;
                this.step = 0;
            }

        }

        return new CreateOrder();
    };

    controller.$inject = ['Base', 'waves', 'utils'];

    angular.module('app.dex').component('wCreateOrder', {
        bindings: {},
        templateUrl: 'modules/dex/directives/createOrder/createOrder.html',
        transclude: false,
        controller
    });
})();

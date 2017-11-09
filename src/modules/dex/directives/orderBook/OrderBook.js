(function () {
    'use strict';

    /**
     *
     * @param {AssetsService} assetsService
     * @param {Base} Base
     * @return {OrderBook}
     */
    const controller = function (assetsService, Base) {

        class OrderBook extends Base {

            constructor() {
                super();
                this._buy = [];
                this._sell = [];
                this.observe(['_buy', '_sell'], () => this._currentOrders());
                this.observe(['amountAssetId', 'priceAssetId'], () => this._getAssets());
            }

            _currentOrders() {
                const filter = function (item) {
                    const clone = { ...item };
                    clone.total = clone.size * clone.price;
                    return clone;
                };
                this.by = (this._buy || []).map(filter);
                this.sell = (this._sell || []).map(filter);
            }

            _getAssets() {
                if (!this.amountAssetId || !this.priceAssetId) {
                    return null;
                }
                assetsService.getAssetInfo(this.amountAssetId)
                    .then((data) => {
                        this.amountAsset = data;
                    });
                assetsService.getAssetInfo(this.priceAssetId)
                    .then((data) => {
                        this.priceAsset = data;
                    });
            }

        }

        return new OrderBook();
    };

    controller.$inject = ['assetsService', 'Base'];

    angular.module('app.dex')
        .component('wDexOrderBook', {
            bindings: {
                amountAssetId: '<',
                priceAssetId: '<',
                _by: '<by',
                _sell: '<sell'
            },
            templateUrl: 'modules/dex/directives/orderBook/orderBook.html',
            controller
        });
})();

(function () {
    'use strict';

    /**
     *
     * @param {AssetsService} assetsService
     * @param {Base} Base
     * @return {OrderBook}
     */
    const controller = function (assetsService, Base, createPoll) {

        class OrderBook extends Base {

            constructor() {
                super();
                /**
                 * @type {Object}
                 */
                this.orders = null;
                /**
                 * @type {string}
                 * @private
                 */
                this._amountAssetId = null;
                /**
                 * @type {string}
                 * @private
                 */
                this._priceAssetId = null;

                this.syncSettings({
                    _amountAssetId: 'dex.amountAssetId',
                    _priceAssetId: 'dex.priceAssetId'
                }).then(() => {
                    const poll = createPoll(this, this._getOrders, 'orders', 2000);
                    this.observe(['_amountAssetId', '_priceAssetId'], () => poll.restart());
                });
            }

            _getOrders() {
                return assetsService.getOrders(this._amountAssetId, this._priceAssetId);
            }

        }

        return new OrderBook();
    };

    controller.$inject = ['assetsService', 'Base', 'createPoll'];

    angular.module('app.dex')
        .component('wDexOrderBook', {
            templateUrl: 'modules/dex/directives/orderBook/orderBook.html',
            controller
        });
})();

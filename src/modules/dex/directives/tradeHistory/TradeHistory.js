(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @param {Scope} $scope
     * @param {Poll} Poll
     * @param {AssetsService} assetsService
     * @param {DataFeed} dataFeed
     * @return {TradeHistory}
     */
    const controller = function (Base, $scope, Poll, assetsService, dataFeed) {

        class TradeHistory extends Base {

            constructor() {
                super();
                /**
                 * @type {string}
                 */
                this.amountAssetId = null;
                /**
                 * @type {string}
                 */
                this.priceAssetId = null;
                /**
                 * @type {IAssetInfo}
                 */
                this.priceAsset = null;
                /**
                 * @type {Array}
                 */
                this.orders = [];
                /**
                 * @type {Poll}
                 */
                this.pool = new Poll(this._getTradeHistory.bind(this), this._applyTradeHistory.bind(this), 5000);

                this.shema = new tsApiValidator.Schema({
                    type: 'array',
                    required: true,
                    content: {
                        type: 'object',
                        required: true,
                        content: {
                            price: { type: 'number', required: true },
                            size: { type: 'number', required: true, path: 'amount' },
                            date: { type: 'date', required: true, path: 'timestamp' },
                            type: { type: 'string', required: true }
                        }
                    }
                });

                this.observe(['amountAssetId', 'priceAssetId'], this._onChangeAssets);
            }

            $onDestroy() {
                super.$onDestroy();
                this.pool.destroy();
            }

            _getHeaderCellTemplate(literal) {
                return `<div><w-i18n w-i18n-ns="app.dex">${literal}</w-i18n></div>`;
            }

            _onChangeAssets() {
                this.orders = [];
                this.pool.restart();
                assetsService.getAssetInfo(this.priceAssetId)
                    .then((asset) => {
                        this.priceAsset = asset;
                    });
            }

            _applyTradeHistory(data) {
                if (data) {
                    this.orders = this.shema.parse(data);
                } else {
                    this.orders = [];
                }
            }

            _getTradeHistory() {
                if (!this.amountAssetId || !this.priceAssetId) {
                    return null;
                }
                return dataFeed.trades(this.amountAssetId, this.priceAssetId);
            }

        }

        return new TradeHistory();
    };

    controller.$inject = ['Base', '$scope', 'Poll', 'assetsService', 'dataFeed', 'i18n'];

    angular.module('app.dex')
        .component('wDexTradeHistory', {
            bindings: {
                amountAssetId: '<',
                priceAssetId: '<'
            },
            templateUrl: '/modules/dex/directives/tradeHistory/tradeHistory.html',
            controller
        });
})();

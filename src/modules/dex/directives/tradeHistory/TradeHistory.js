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
                this.poll = new Poll(this._getTradeHistory.bind(this), this._applyTradeHistory.bind(this), 5000);

                this.shema = new tsApiValidator.Schema({
                    type: 'array',
                    required: true,
                    content: {
                        type: 'object',
                        required: true,
                        content: {
                            price: { type: tsApiValidator.NumberPart, required: true },
                            size: { type: tsApiValidator.NumberPart, required: true, path: 'amount' },
                            date: { type: tsApiValidator.DatePart, required: true, path: 'timestamp' },
                            type: { type: tsApiValidator.StringPart, required: true }
                        }
                    }
                });

                this.observe(['amountAssetId', 'priceAssetId'], this._onChangeAssets);
            }

            $onDestroy() {
                super.$onDestroy();
                this.poll.destroy();
            }

            _onChangeAssets() {
                this.orders = [];
                this.poll.restart();
                assetsService.getAssetInfo(this.priceAssetId)
                    .then((asset) => {
                        this.priceAsset = asset;
                    });
            }

            _applyTradeHistory(data) {
                if (data) {
                    this.orders = data;
                } else {
                    this.orders = [];
                }
            }

            _getTradeHistory() {
                if (!this.amountAssetId || !this.priceAssetId) {
                    return null;
                }
                return dataFeed.trades(this.amountAssetId, this.priceAssetId)
                    .then(data => this.shema.parse(data));
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

(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @param {Scope} $scope
     * @param {AssetsService} assetsService
     * @param {DataFeed} dataFeed
     * @param {} createPoll
     * @return {TradeHistory}
     */
    const controller = function (Base, $scope, assetsService, dataFeed, createPoll) {

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
                this.poll = createPoll(this, this._getTradeHistory, 'orders', 2000);

                this.shema = new tsApiValidator.Schema({
                    type: tsApiValidator.ArrayPart,
                    // required: true, TODO uncomment
                    content: {
                        type: tsApiValidator.ObjectPart,
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

            _getTradeHistory() {
                if (!this.amountAssetId || !this.priceAssetId) {
                    return [];
                }
                return dataFeed.trades(this.amountAssetId, this.priceAssetId)
                    .then(data => this.shema.parse(data));
            }

        }

        return new TradeHistory();
    };

    controller.$inject = ['Base', '$scope', 'assetsService', 'dataFeed', 'i18n', 'createPoll'];

    angular.module('app.dex')
        .component('wDexTradeHistory', {
            bindings: {
                amountAssetId: '<',
                priceAssetId: '<'
            },
            templateUrl: 'modules/dex/directives/tradeHistory/tradeHistory.html',
            controller
        });
})();

(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @param {Scope} $scope
     * @param {Waves} waves
     * @param {DataFeed} dataFeed
     * @param {} createPoll
     * @return {TradeHistory}
     */
    const controller = function (Base, $scope, waves, dataFeed, createPoll) {

        class TradeHistory extends Base {

            constructor() {
                super();
                /**
                 * @type {string}
                 */
                this._amountAssetId = null;
                /**
                 * @type {string}
                 */
                this._priceAssetId = null;
                /**
                 * @type {IAsset}
                 */
                this.priceAsset = null;
                /**
                 * @type {Array}
                 */
                this.orders = [];

                this.shema = new tsApiValidator.Schema({
                    type: tsApiValidator.ArrayPart,
                    required: true,
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

                this.syncSettings({
                    _amountAssetId: 'dex.amountAssetId',
                    _priceAssetId: 'dex.priceAssetId'
                });

                /**
                 * @type {Poll}
                 */
                this.poll = createPoll(this, this._getTradeHistory, 'orders', 2000);
                this.observe(['_amountAssetId', '_priceAssetId'], this._onChangeAssets);

                this._onChangeAssets();
            }

            $onDestroy() {
                super.$onDestroy();
                this.poll.destroy();
            }

            _onChangeAssets() {
                this.orders = [];
                this.poll.restart();
                waves.node.assets.info(this._priceAssetId)
                    .then((asset) => {
                        this.priceAsset = asset;
                    });
                waves.node.assets.info(this._amountAssetId)
                    .then((asset) => {
                        this.amountAsset = asset;
                    });
            }

            _getTradeHistory() {
                if (!this._amountAssetId || !this._priceAssetId) {
                    return [];
                }
                return dataFeed.trades(this._amountAssetId, this._priceAssetId)
                    .then(data => this.shema.parse(data));
            }

        }

        return new TradeHistory();
    };

    controller.$inject = ['Base', '$scope', 'waves', 'dataFeed', 'createPoll'];

    angular.module('app.dex')
        .component('wDexTradeHistory', {
            templateUrl: 'modules/dex/directives/tradeHistory/tradeHistory.html',
            controller
        });
})();

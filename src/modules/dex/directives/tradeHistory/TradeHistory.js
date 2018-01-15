(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @param {Scope} $scope
     * @param {Waves} waves
     * @param {DataFeed} dataFeed
     * @param {function} createPoll
     * @return {TradeHistory}
     */
    const controller = function (Base, $scope, waves, dataFeed, createPoll) {

        class TradeHistory extends Base {

            constructor() {
                super();
                /**
                 * @type {{amount: string, price: string}}
                 * @private
                 */
                this._assetIdPair = null;
                /**
                 * @type {Asset}
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
                    _assetIdPair: 'dex.assetIdPair'
                });

                /**
                 * @type {Poll}
                 */
                this.poll = createPoll(this, this._getTradeHistory, 'orders', 2000);
                this.observe('_assetIdPair', this._onChangeAssets);

                this._onChangeAssets();
            }

            $onDestroy() {
                super.$onDestroy();
                this.poll.destroy();
            }

            _onChangeAssets() {
                this.orders = [];
                this.poll.restart();
                Waves.AssetPair.get(this._assetIdPair.amount, this._assetIdPair.price).then((pair) => {
                    this.priceAsset = pair.priceAsset;
                    this.amountAsset = pair.amountAsset;
                });
            }

            _getTradeHistory() {
                return dataFeed.trades(this._assetIdPair.amount, this._assetIdPair.price)
                    .then((data) => this.shema.parse(data));
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

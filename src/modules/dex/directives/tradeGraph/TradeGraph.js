(function () {
    'use strict';

    /**
     * @param Base
     * @param utils
     * @param {AssetsService} assetsService
     * @return {TradeGraph}
     */
    const controller = function (Base, utils, assetsService) {

        class TradeGraph extends Base {

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

                this.options = {
                    margin: {
                        left: -1,
                        top: 20,
                        right: -1,
                        bottom: 0
                    },
                    grid: {
                        x: false,
                        y: false
                    },
                    series: [
                        {
                            dataset: 'asks',
                            key: 'amount',
                            label: 'An area series',
                            color: '#F27057',
                            type: ['line', 'line', 'area'],
                        },
                        {
                            dataset: 'bids',
                            key: 'amount',
                            label: 'An area series',
                            color: '#2B9F72',
                            type: ['line', 'line', 'area'],
                        }
                    ],
                    axes: {
                        x: { key: 'price', type: 'linear' },
                        y: { key: 'amount', ticks: 4 }
                    }
                };

                this.data = {
                    asks: [{ amount: 0, price: 0 }],
                    bids: [{ amount: 0, price: 0 }]
                };

                this.observe(['amountAssetId', 'priceAssetId'], this._onChangeAssets);
            }

            _onChangeAssets() {
                const amountId = this.amountAssetId, priceId = this.priceAssetId;
                Promise.all([
                    assetsService.getAssetInfo(priceId),
                    assetsService.getAssetInfo(amountId)
                ])
                    .then((data) => {
                        const [priceAsset, amountAsset] = data;
                        utils.when(fetch(`${WavesApp.network.matcher}/matcher/orderbook/${amountId}/${priceId}`)
                            .then(r => r.json()))
                            .then((data) => {
                                console.log(data);
                                const mapCallback = function (item) {
                                    item.price = item.price / (10 ** priceAsset.precision);
                                    item.amount = item.amount / (10 ** amountAsset.precision);
                                    return item;
                                };
                                this.data.asks = data.asks.map(mapCallback);
                                this.data.bids = data.bids.map(mapCallback);
                            });
                    });
            }

        }

        return new TradeGraph();
    };

    controller.$inject = ['Base', 'utils', 'assetsService'];

    angular.module('app.dex')
        .component('wDexTradeGraph', {
            bindings: {
                amountAssetId: '<',
                priceAssetId: '<'
            },
            templateUrl: 'modules/dex/directives/tradeGraph/tradeGraph.html',
            controller
        });
})();

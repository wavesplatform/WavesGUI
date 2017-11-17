(function () {
    'use strict';

    /**
     *
     * @param {AssetsService} assetsService
     * @param {Base} Base
     * @return {OrderBook}
     */
    const controller = function (assetsService, Base, createPoll, apiWorker, $element) {

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
                    const poll = createPoll(this, this._getOrders, 'orders', 12000);
                    this.observe(['_amountAssetId', '_priceAssetId'], () => poll.restart());
                });
            }

            _getOrders() {
                return apiWorker.process((Waves, { assetId1, assetId2 }) => {
                    return Waves.AssetPair.get(assetId1, assetId2).then((pair) => {

                        const getCell = function (content) {
                            return `<div class="table-cell">${content}</div>`
                        };

                        const processDecimal = function (decimal) {
                            const mute = [];
                            decimal.split('')
                                .reverse()
                                .some((char) => {
                                    if (char === '0') {
                                        mute.push(0);
                                        return false;
                                    }
                                    return true;
                                });
                            const end = decimal.length - mute.length;
                            return `${decimal.substr(0, end)}<span class="decimal-muted">${mute.join('')}</span>`;
                        };

                        const processNum = function (num) {
                            const parts = String(num).split('.');
                            const int = parts[0], decimal = parts[1];

                            if (decimal) {
                                const decimalTpl = processDecimal(decimal);
                                return `<span class="int">${int}.</span><span class="decimal">${decimalTpl}</span>`;
                            } else {
                                return `<span class="int">${int}</span>`;
                            }
                        };

                        const getCells = function (item) {
                            return [
                                processNum(item.amount),
                                processNum(item.price),
                                processNum(item.total)
                            ].map((content, i) => {
                                return `<w-cell class="cell-${i}">${getCell(content)}</w-cell>`;
                            }).join('');
                        };

                        const process = function (list) {
                            return list.map((item) => {
                                const cells = getCells(item);
                                return `<w-row><div class="table-row">${cells}</div></w-row>`;
                            });
                        };

                        const parse = function (list) {
                            return Promise.all((list || []).map((item) => {
                                return Promise.all([
                                    Waves.Money.fromCoins(String(item.amount), pair.amountAsset).then((amount) => {
                                        return amount.getTokens()
                                    }),
                                    Waves.OrderPrice.fromMatcherCoins(String(item.price), pair).then((orderPrice) => {
                                        return orderPrice.getTokens()
                                    })
                                ]).then((amountPrice) => {
                                    const amount = amountPrice[0];
                                    const price = amountPrice[1];
                                    const total = amount.mul(price);
                                    return {
                                        amount: amount.toFixed(pair.amountAsset.precision),
                                        price: price.toFixed(pair.priceAsset.precision),
                                        total: total.toFixed(pair.priceAsset.precision)
                                    }
                                });
                            }));
                        };

                        return Waves.API.Matcher.v1.getOrderbook(pair.amountAsset.id, pair.priceAsset.id)
                            .then((orderBook) => {
                                return Promise.all([
                                    parse(orderBook.bids),
                                    parse(orderBook.asks)
                                ]).then((bidAsks) => {
                                    const bids = bidAsks[0];
                                    const asks = bidAsks[1];

                                    return { bids: process(bids).join(''), asks: process(asks).join('') };
                                });
                            });
                    });
                }, { assetId1: this._amountAssetId, assetId2: this._priceAssetId })
                    .then(({ bids, asks }) => {

                        const template = `<div class="bids">${bids}</div><div class="asks"${asks}</div>`;
                        $element.find('w-scroll-box').html(template);
                    });
            }

        }

        return new OrderBook();
    };

    controller.$inject = ['assetsService', 'Base', 'createPoll', 'apiWorker', '$element'];

    angular.module('app.dex')
        .component('wDexOrderBook', {
            templateUrl: 'modules/dex/directives/orderBook/orderBook.html',
            controller
        });
})();

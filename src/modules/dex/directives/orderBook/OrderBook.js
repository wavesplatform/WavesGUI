(function () {
    'use strict';

    /**
     *
     * @param {Base} Base
     * @param {function} createPoll
     * @param {JQuery} $element
     * @return {OrderBook}
     */
    const controller = function (Base, createPoll, $element) {

        class OrderBook extends Base {

            constructor() {
                super();
                /**
                 * @type {object}
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
                /**
                 * @type {Wrap}
                 * @private
                 */
                this._worker = workerWrapper.create();

                this.syncSettings({
                    _amountAssetId: 'dex.amountAssetId',
                    _priceAssetId: 'dex.priceAssetId'
                });

                const poll = createPoll(this, this._getOrders, 'orders', 12000);
                this.observe(['_amountAssetId', '_priceAssetId'], () => poll.restart());

            }

            _getOrders() {
                return Waves.AssetPair.get(this._amountAssetId, this._priceAssetId)
                    .then((pair) => {

                        const getCell = function (content) {
                            return `<div class="table-cell">${content}</div>`;
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
                            const parts = String(num)
                                .split('.');
                            const int = parts[0], decimal = parts[1];

                            if (decimal) {
                                const decimalTpl = processDecimal(decimal);
                                return `<span class="int">${int}.</span><span class="decimal">${decimalTpl}</span>`;
                            } else {
                                return `<span class="int">${int}</span>`;
                            }
                        };

                        const getCells = function (item) {
                            return [processNum(item.amount), processNum(item.price), processNum(item.total)]
                                .map((content, i) => `<w-cell class="cell-${i}">${getCell(content)}</w-cell>`)
                                .join('');
                        };

                        const process = function (list) {
                            return list.map((item) => {
                                const cells = getCells(item);
                                return `<w-row><div class="table-row">${cells}</div></w-row>`;
                            });
                        };

                        const parse = function (list) {
                            return Promise.all((list || [])
                                .map((item) => Promise.all([
                                    Waves.Money.fromCoins(String(item.amount), pair.amountAsset)
                                        .then((amount) => amount.getTokens()),
                                    Waves.OrderPrice.fromMatcherCoins(String(item.price), pair)
                                        .then((orderPrice) => orderPrice.getTokens())
                                ])
                                    .then((amountPrice) => {
                                        const amount = amountPrice[0];
                                        const price = amountPrice[1];
                                        const total = amount.mul(price);
                                        return {
                                            amount: amount.toFixed(pair.amountAsset.precision),
                                            price: price.toFixed(pair.priceAsset.precision),
                                            total: total.toFixed(pair.priceAsset.precision)
                                        };
                                    })));
                        };

                        return Waves.API.Matcher.v1.getOrderbook(pair.amountAsset.id, pair.priceAsset.id)
                            .then((orderBook) => Promise.all([parse(orderBook.bids), parse(orderBook.asks)])
                                .then(([bids, asks]) => {

                                    const [lastAsk] = asks;
                                    const [firstBid] = bids;

                                    const spread = firstBid && lastAsk && {
                                        amount: lastAsk.price,
                                        price: new BigNumber(lastAsk.price).sub(firstBid.price)
                                            .abs()
                                            .toFormat(pair.priceAsset.precision),
                                        total: firstBid.price
                                    };

                                    return {
                                        bids: process(bids)
                                            .join(''),
                                        spread: spread && process([spread])[0],
                                        asks: process(asks.reverse())
                                            .join('')
                                    };
                                }));
                    })
                    .then(({ bids, spread, asks }) => {
                        const template = `<div class="asks">${asks}</div><div class="spread body-2">${spread}</div><div class="bids">${bids}</div>`;
                        const $box = $element.find('w-scroll-box');
                        $box.html(template);
                    });
            }

        }

        return new OrderBook();
    };

    controller.$inject = ['Base', 'createPoll', '$element'];

    angular.module('app.dex').component('wDexOrderBook', {
        templateUrl: 'modules/dex/directives/orderBook/orderBook.html',
        controller
    });
})();

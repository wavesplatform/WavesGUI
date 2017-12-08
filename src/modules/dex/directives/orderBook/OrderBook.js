(function () {
    'use strict';

    /**
     *
     * @param {Base} Base
     * @param {function} createPoll
     * @param {JQuery} $element
     * @param {Waves} waves
     * @return {OrderBook}
     */
    const controller = function (Base, createPoll, $element, waves) {

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
                 * @type {boolean}
                 * @private
                 */
                this._showSpread = true;

                this.syncSettings({
                    _amountAssetId: 'dex.amountAssetId',
                    _priceAssetId: 'dex.priceAssetId'
                });

                const poll = createPoll(this, this._getOrders, 'orders', 12000);
                this.observe(['_amountAssetId', '_priceAssetId'], () => {
                    this._showSpread = true;
                    poll.restart();
                });

            }

            _getOrders() {
                return waves.matcher.getOrderBook(this._amountAssetId, this._priceAssetId)
                    .then(({ bids, asks, spread }) => {

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

                        return {
                            bids: process(bids)
                                .join(''),
                            spread: spread && process([spread])[0],
                            asks: process(asks.reverse())
                                .join('')
                        };
                    })
                    .then(({ bids, spread, asks }) => {
                        const template = `<div class="asks">${asks}</div><div class="spread body-2">${spread}</div><div class="bids">${bids}</div>`;
                        const $box = $element.find('w-scroll-box');
                        const box = $box.get(0);
                        $box.html(template);

                        if (this._showSpread) {
                            this._showSpread = false;

                            const spread = box.querySelector('.spread');
                            box.scrollTop = spread.offsetTop - box.offsetTop - box.clientHeight / 2 + spread.clientHeight / 2;
                        }
                    });
            }

        }

        return new OrderBook();
    };

    controller.$inject = ['Base', 'createPoll', '$element', 'waves'];

    angular.module('app.dex').component('wDexOrderBook', {
        templateUrl: 'modules/dex/directives/orderBook/orderBook.html',
        controller
    });
})();

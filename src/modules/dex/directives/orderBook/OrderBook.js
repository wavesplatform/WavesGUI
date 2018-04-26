/* global BigNumber, tsUtils */
(function () {
    'use strict';

    /**
     *
     * @param {Base} Base
     * @param {IPollCreate} createPoll
     * @param {JQuery} $element
     * @param {Waves} waves
     * @param {DexDataService} dexDataService
     * @param {app.utils} utils
     * @param {$rootScope.Scope} $scope
     * @return {OrderBook}
     */
    const controller = function (Base, createPoll, $element, waves, dexDataService, utils, $scope) {

        class OrderBook extends Base {

            constructor() {
                super();
                /**
                 * @type {object}
                 */
                this.orders = null;
                /**
                 * @type {Asset}
                 */
                this.amountAsset = null;
                /**
                 * @type {Asset}
                 */
                this.priceAsset = null;
                /**
                 * @type {{amount: string, price: string}}
                 * @private
                 */
                this._assetIdPair = null;
                /**
                 * @type {boolean}
                 * @private
                 */
                this._showSpread = true;
                /**
                 * @type {*}
                 * @private
                 */
                this._lastResopse = null;
                /**
                 * @type {boolean}
                 * @private
                 */
                this._noRender = false;

                this.syncSettings({
                    _assetIdPair: 'dex.assetIdPair'
                });

                const poll = createPoll(this, this._getOrders, 'orders', 1000, { $scope });

                this.observe('_assetIdPair', () => {
                    this._showSpread = true;
                    poll.restart();
                });

                $element.on('mousedown touchstart', 'w-scroll-box w-row', () => {
                    this._noRender = true;
                });

                $element.on('mouseup touchend', 'w-scroll-box w-row', () => {
                    this._noRender = false;
                    if (this._lastResopse) {
                        this._render(this._lastResopse);
                        this._lastResopse = null;
                    }
                });

                $element.on('click', 'w-scroll-box w-row', (e) => {
                    const amount = e.currentTarget.getAttribute('data-amount');
                    const price = e.currentTarget.getAttribute('data-price');
                    const type = e.currentTarget.getAttribute('data-type');

                    if (amount && price && type) {
                        dexDataService.chooseOrderBook.dispatch({ amount, price, type });
                    }
                });

            }

            /**
             * @return {Promise}
             * @private
             */
            _getOrders() {
                return waves.matcher.getOrderBook(this._assetIdPair.amount, this._assetIdPair.price)
                    .then(({ bids, asks, spread, pair }) => {

                        this.amountAsset = pair.amountAsset;
                        this.priceAsset = pair.priceAsset;

                        const getCell = function (content) {
                            return `<div class="table-cell">${content}</div>`;
                        };

                        const getCells = function (item) {
                            return [
                                utils.getNiceNumberTemplate(item.amount, pair.amountAsset.precision, true),
                                utils.getNiceNumberTemplate(item.price, pair.priceAsset.precision, true),
                                utils.getNiceNumberTemplate(item.total, pair.priceAsset.precision, true)
                            ]
                                .map((content, i) => `<w-cell class="cell-${i}">${getCell(content)}</w-cell>`)
                                .join('');
                        };

                        const process = function (list) {
                            return list.map((item) => {
                                const cells = getCells(item);
                                const attrs = [
                                    item.totalAmount ? `data-amount="${item.totalAmount}"` : null,
                                    item.price ? `data-price="${item.price}"` : null,
                                    item.type ? `data-type="${item.type}"` : null
                                ]
                                    .filter(Boolean)
                                    .join(' ');

                                return `<w-row ${attrs}><div class="table-row">${cells}</div></w-row>`;
                            });
                        };

                        const sum = (list, type) => {
                            let total = new BigNumber(0);
                            let amountTotal = new BigNumber(0);

                            return list.map((item) => {
                                item = tsUtils.clone(item);
                                total = total.add(item.total);
                                amountTotal = amountTotal.add(item.amount);
                                item.type = type;
                                item.total = total.toFixed(pair.priceAsset.precision);
                                item.totalAmount = amountTotal.toFixed(pair.amountAsset.precision);
                                return item;
                            });
                        };

                        bids = sum(bids, 'sell');
                        asks = sum(asks, 'buy');

                        return {
                            bids: process(bids).join(''),
                            spread: spread && process([spread])[0],
                            asks: process(asks.slice().reverse()).join('')
                        };
                    })
                    .then((data) => this._render(data));
            }

            /**
             * @param bids
             * @param spread
             * @param asks
             * @return {null}
             * @private
             */
            _render({ bids, spread, asks }) {

                if (this._noRender) {
                    this._lastResopse = { bids, spread, asks };
                    return null;
                }

                this.hasOrderBook = Boolean(bids || asks);

                const template = (
                    `<div class="asks">${asks}</div>` +
                    `<div class="spread body-2">${spread}</div>` +
                    `<div class="bids">${bids}</div>`
                );
                const $box = $element.find('w-scroll-box');
                const box = $box.get(0);
                $box.html(template);

                if (this._showSpread) {
                    setTimeout(() => {
                        requestAnimationFrame(() => {
                            this._showSpread = false;

                            const spread = box.querySelector('.spread');
                            box.scrollTop =
                                spread.offsetTop - box.offsetTop - box.clientHeight / 2 + spread.clientHeight / 2;
                        });
                    }, 0);
                }
            }

        }

        return new OrderBook();
    };

    controller.$inject = ['Base', 'createPoll', '$element', 'waves', 'dexDataService', 'utils', '$scope'];

    angular.module('app.dex').component('wDexOrderBook', {
        templateUrl: 'modules/dex/directives/orderBook/orderBook.html',
        controller
    });
})();

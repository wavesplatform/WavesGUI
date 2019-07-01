(function () {
    'use strict';

    /**
     * @param {typeof Base} Base
     * @param {app.utils} utils
     * @param {app.i18n} i18n
     * @param {DexDataService} dexDataService
     */
    const service = function (Base, utils, i18n, dexDataService) {

        /**
         * @class OrderListItem
         * @extends Base
         */
        class OrderListItem extends Base {

            /**
             * @type {OrderBook.IOrder}
             * @private
             */
            _data = null;
            /**
             * @type {HTMLElement}
             * @private
             */
            _root = document.createElement('w-row');
            /**
             * @type {HTMLElement}
             * @private
             */
            _parent;
            /**
             * @type {HTMLElement}
             * @private
             */
            _amountNode;
            /**
             * @type {HTMLElement}
             * @private
             */
            _priceNode;
            /**
             * @type {HTMLElement}
             * @private
             */
            _totalNode;
            /**
             * @type {HTMLElement}
             * @private
             */
            _tooltipSell;
            /**
             * @type {HTMLElement}
             * @private
             */
            _tooltipBuy;
            /**
             * @type {AssetPair}
             * @private
             */
            _pair;


            constructor(parent) {
                super();
                this._parent = parent;
                this._parent.appendChild(this._root);
                this._createDom();
                this._setHandlers();
                this._draw();
            }

            /**
             * @return {OrderBook.IOrder}
             */
            getData() {
                return this._data;
            }

            /**
             * @param {OrderBook.IOrder} data
             * @param {OrderBook.ICrop} crop
             * @param {Record<string, boolean>} priceHash
             * @param {AssetPair} pair
             */
            render(data, crop, priceHash, pair) {
                if (OrderListItem._isEqual(this._data, data)) {
                    return null;
                }

                this._pair = pair;
                this._data = data;
                this._draw(crop, priceHash, pair);
            }

            /**
             * @return {number}
             */
            getHeight() {
                return this._root.clientHeight;
            }

            /**
             * @param {OrderBook.ICrop} [crop]
             * @param {Record<string, boolean>} [priceHash]
             * @param {AssetPair} [pair]
             * @private
             */
            _draw(crop, priceHash, pair) {
                if (this._data) {
                    this._amountNode.innerHTML =
                        utils.getNiceNumberTemplate(this._data.amount, pair.amountAsset.precision, true);
                    this._priceNode.innerHTML =
                        utils.getNiceNumberTemplate(this._data.price, pair.priceAsset.precision, true);
                    this._totalNode.innerHTML =
                        utils.getNiceNumberTemplate(this._data.total, pair.priceAsset.precision, true);

                    const hasOrder = !!priceHash[this._data.price.toFixed(pair.priceAsset.precision)];
                    const inRange = this._data.price.gte(crop.min) && this._data.price.lte(crop.max);

                    this._root.classList.toggle('active', hasOrder);
                    this._root.classList.toggle('no-market-price', !inRange);
                } else {
                    this._amountNode.innerText = '—';
                    this._priceNode.innerText = '—';
                    this._totalNode.innerText = '—';

                    this._root.classList.toggle('active', false);
                    this._root.classList.toggle('no-market-price', false);
                }
                this._root.classList.toggle('isEmpty', !this._data);
            }

            /**
             * @private
             */
            _setHandlers() {
                this.listenEventEmitter(this._root, 'mouseenter', () => {
                    this._onHoverIn();
                }, Base.DOM_EVENTS_METHODS);
                this.listenEventEmitter(this._root, 'click', () => {
                    OrderListItem._onClickRow(this);
                }, Base.DOM_EVENTS_METHODS);
            }

            /**
             * @private
             */
            _onHoverIn() {
                const sellTooltip = this._pair && i18n.translate('orderbook.ask.tooltipText', 'app.dex', {
                    amountAsset: this._pair.amountAsset.displayName,
                    priceAsset: this._pair.priceAsset.displayName,
                    price: this._data.price.toFormat(this._pair.priceAsset.precision)
                }) || '-';

                const buyTooltip = this._pair && i18n.translate('orderbook.bid.tooltipText', 'app.dex', {
                    amountAsset: this._pair.amountAsset.displayName,
                    priceAsset: this._pair.priceAsset.displayName,
                    price: this._data.price.toFormat(this._pair.priceAsset.precision)
                }) || '-';

                this._tooltipSell.innerText = sellTooltip;
                this._tooltipBuy.innerText = buyTooltip;
            }

            /**
             * @private
             */
            _createDom() {
                this._root.appendChild(
                    OrderListItem._createElement('div', 'table-row', [
                        OrderListItem._createElement('div', 'tooltip-dex', [
                            this._tooltipSell = OrderListItem._createElement('span', 'tooltip-ask'),
                            this._tooltipBuy = OrderListItem._createElement('span', 'tooltip-bid')
                        ]),
                        OrderListItem._createElement('w-cell', 'cell-0', [
                            this._amountNode = OrderListItem._createElement('div', 'table-cell')
                        ]),
                        OrderListItem._createElement('w-cell', 'cell-1', [
                            this._priceNode = OrderListItem._createElement('div', 'table-cell')
                        ]),
                        OrderListItem._createElement('w-cell', 'cell-2', [
                            this._totalNode = OrderListItem._createElement('div', 'table-cell')
                        ])
                    ])
                );
            }

            /**
             * @param {OrderBook.IOrder} a
             * @param {OrderBook.IOrder} b
             * @return {boolean}
             * @private
             */
            static _isEqual(a, b) {
                return (!a && !b) ||
                    (a && b && Object.entries(a).every(([key, value]) => utils.isEqual(value, b[key])));
            }

            /**
             * @param {string} tagName
             * @param {string} className
             * @param {Array<Node>} [children]
             * @return {HTMLElement}
             * @private
             */
            static _createElement(tagName, className, children) {
                const element = document.createElement(tagName);
                element.classList.add(className);

                if (children && children.length) {
                    children.forEach(child => {
                        element.appendChild(child);
                    });
                }

                return element;
            }

            /**
             * @param {OrderListItem} item
             * @private
             */
            static _onClickRow(item) {
                const order = item.getData();

                if (!order) {
                    return null;
                }

                dexDataService.chooseOrderBook.dispatch({
                    amount: order.totalAmount.toFixed(2),
                    price: order.price.toFixed(),
                    type: order.type
                });
            }

        }

        return OrderListItem;
    };

    service.$inject = ['Base', 'utils', 'i18n', 'dexDataService'];

    angular.module('app.dex').service('OrderListItem', service);
})();

/**
 * @name OrderListItem
 */

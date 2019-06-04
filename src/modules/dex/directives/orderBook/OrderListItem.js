(function () {
    'use strict';

    /**
     * @param {typeof Base} Base
     * @param {Function} $templateRequest
     */
    const service = function (Base, $templateRequest) {

        const Handlebars = require('handlebars');

        return Promise.all([
            $templateRequest('modules/dex/directives/orderBook/orderbook.row.hbs'),
            $templateRequest('modules/dex/directives/orderBook/emptyRow.html')
        ])
            .then(([row, emptyRow]) => {

                /**
                 * @class OrderListItem
                 */
                class OrderListItem extends Base {

                    /**
                     * @type {OrderListItem.IData}
                     * @private
                     */
                    _data = null;
                    /**
                     * @type {HTMLElement}
                     * @private
                     */
                    _root = document.createElement('w-row');
                    /**
                     * @type {HandlebarsTemplateDelegate}
                     * @private
                     */
                    _template = Handlebars.compile(row);
                    /**
                     * @type {HandlebarsTemplateDelegate}
                     * @private
                     */
                    _emptyTemplate = Handlebars.compile(emptyRow);
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


                    constructor(parent) {
                        super();
                        this._parent = parent;
                        this._parent.appendChild(this._root);
                        this._createDom();
                        this._draw();
                    }

                    render(data) {
                        if (OrderListItem._isEqual(this._data, data)) {
                            return null;
                        }

                        this._data = data;
                        this._draw();
                    }

                    getHeight() {
                        return this._root.clientHeight;
                    }

                    /**
                     * @private
                     */
                    _draw() {

                        const apply = (active, noMarket, attrs) => {
                            if (this._data) {
                                this._amountNode.innerHTML = this._data.amount;
                                this._priceNode.innerHTML = this._data.amount;
                                this._totalNode.innerHTML = this._data.amount;
                            } else {
                                this._amountNode.innerText = '—';
                                this._priceNode.innerText = '—';
                                this._totalNode.innerText = '—';
                            }
                            this._root.classList.toggle('active', active);
                            this._root.classList.toggle('no-market-price', noMarket);
                            Object.entries(attrs).forEach(([name, value]) => {
                                this._root.setAttribute(name, value);
                            });
                        };

                        if (this._data) {
                            apply(this._data.hasOrder, !this._data.inRange, {
                                'data-price': this._data.priceNum,
                                'data-type': this._data.type,
                                'data-amount': this._data.totalAmountNum
                            });
                        } else {
                            apply(false, false, {
                                'data-price': '',
                                'data-type': '',
                                'data-amount': ''
                            });
                        }
                    }

                    _createDom() {
                        this._root.appendChild(
                            OrderListItem._createElement('div', 'table-row', [
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
                     * @param {OrderListItem.IData} a
                     * @param {OrderListItem.IData} b
                     * @return {boolean}
                     * @private
                     */
                    static _isEqual(a, b) {
                        return (!a && !b) || (a && b && ['amount', 'price', 'total'].every(key => a[key] === b[key]));
                    }

                    /**
                     * @param {string} tagName
                     * @param {string} className
                     * @param {Array<HTMLElement>} [children]
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

                }

                return OrderListItem;
            });
    };

    service.$inject = ['Base', '$templateRequest'];

    angular.module('app.dex').service('OrderListItem', service);
})();

/**
 * @name OrderListItem
 */

/**
 * @typedef {object} OrderListItem#IData
 * @property {string} price
 * @property {string} amount
 * @property {string} total
 * @property {boolean} hasOrder
 * @property {boolean} inRange
 * @property {string} priceNum
 * @property {string} type
 * @property {string} totalAmountNum
 */

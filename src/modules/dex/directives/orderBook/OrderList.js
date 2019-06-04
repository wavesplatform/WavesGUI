(function () {
    'use strict';

    /**
     * @param {typeof Base} Base
     * @param {typeof OrderListItem} OrderListItem
     * @param {DexDataService} dexDataService
     */
    const service = function (Base, OrderListItem, dexDataService) {

        /**
         * @class OrderList
         */
        class OrderList extends Base {

            /**
             * @type {Array<OrderListItem>}
             * @private
             */
            _rows = [];
            /**
             * @type {HTMLElement}
             * @private
             */
            _root = null;
            /**
             * @type {HTMLCanvasElement}
             * @private
             */
            _canvas;
            /**
             * @type {CanvasRenderingContext2D}
             * @private
             */
            _ctx;
            /**
             * @type {boolean}
             * @private
             */
            _hasSize = false;
            /**
             * @type {string}
             * @private
             */
            _fillColor;


            constructor(params) {
                super();
                this._fillColor = params.fillColor;
                this._createCanvas(params.node);
                this._createLines(params.node);
            }

            /**
             * @param {Array<OrderBook.IOrder>} data
             * @param {OrderBook.ICrop} crop
             * @param {Record<string, boolean>} priceHash
             * @param {BigNumber} maxAmount
             * @param {AssetPair} pair
             */
            render(data, crop, priceHash, maxAmount, pair) {
                this._initSize();

                const widthList = [];

                this._rows.forEach((row, index) => {
                    row.render(data[index], crop, priceHash, pair);
                    widthList[index] = data[index] && data[index].amount.div(maxAmount).times(100).toFixed(2);
                });

                this._drawCanvas(widthList);
            }

            /**
             * @param node
             * @private
             */
            _createLines(node) {
                const handler = item => {
                    OrderList._onClickRow(item);
                };
                for (let i = 0; i < 100; i++) {
                    const item = new OrderListItem(node);
                    item.addEventListener('click', handler);
                    this._rows.push(item);
                }
            }

            /**
             * @param node
             * @private
             */
            _createCanvas(node) {
                this._canvas = document.createElement('canvas');
                this._canvas.style.position = 'absolute';
                this._canvas.style.left = '0';
                this._canvas.style.top = '0';
                this._ctx = this._canvas.getContext('2d');
                node.style.position = 'relative';
                node.appendChild(this._canvas);
            }

            /**
             * @return {number}
             * @private
             */
            _getLineHeight() {
                const height = this._rows[0].getHeight();
                if (height) {
                    this._getLineHeight = () => height;
                }
                return height;
            }

            /**
             * @private
             */
            _drawCanvas(widthList) {
                const height = this._getLineHeight();
                const rate = this._canvas.width / 100;

                this._clearCanvas();

                if (!height) {
                    return null;
                }

                this._ctx.fillStyle = this._fillColor;

                widthList.forEach((width, index) => {
                    this._ctx.fillRect(0, index * height, width * rate, height);
                });

                this._ctx.stroke();
            }

            _clearCanvas() {
                this._canvas.width = this._canvas.width;
            }

            /**
             * @private
             */
            _initSize() {
                const width = this._canvas.parentElement.clientWidth;
                const height = this._canvas.parentElement.clientHeight;
                this._hasSize = !!width && !!height;
                this._canvas.width = width;
                this._canvas.height = height;
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

        return OrderList;
    };

    service.$inject = ['Base', 'OrderListItem', 'dexDataService'];

    angular.module('app.dex').service('OrderList', service);
})();

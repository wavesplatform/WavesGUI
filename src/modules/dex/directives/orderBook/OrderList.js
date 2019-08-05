(function () {
    'use strict';

    /**
     * @param {typeof Base} Base
     * @param {typeof OrderListItem} OrderListItem
     */
    const service = function (Base, OrderListItem) {

        const SCALE = devicePixelRatio || 1;

        /**
         * @class OrderList
         */
        class OrderList extends Base {

            static ROWS_COUNT = 80;
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
                const widthList = [];

                this._rows.forEach((row, index) => {
                    const item = data[index];
                    row.render(item, crop, priceHash, pair);
                    widthList[index] = item && item.amount.div(maxAmount).mul(100).toFixed(2);
                });

                this._drawCanvas(widthList);
            }

            $onDestroy() {
                super.$onDestroy();
                this._rows.forEach(row => {
                    row.$onDestroy();
                });
            }

            /**
             * @param node
             * @private
             */
            _createLines(node) {
                for (let i = 0; i < OrderList.ROWS_COUNT; i++) {
                    this._rows.push(new OrderListItem(node));
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
                this._initSize();

                const height = this._getLineHeight();
                const rate = this._canvas.width / 100;

                this._clearCanvas();

                if (!height) {
                    return null;
                }

                this._ctx.fillStyle = this._fillColor;

                widthList.forEach((width, index) => {
                    this._ctx.fillRect(0, index * height * SCALE, width * rate, height * SCALE);
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
                this._canvas.width = width * SCALE;
                this._canvas.height = height * SCALE;
                this._canvas.style.width = `${width}px`;
                this._canvas.style.height = `${height}px`;

                if (width && height) {
                    this._initSize = () => undefined;
                }
            }

        }

        return OrderList;
    };

    service.$inject = ['Base', 'OrderListItem'];

    angular.module('app.dex').service('OrderList', service);
})();

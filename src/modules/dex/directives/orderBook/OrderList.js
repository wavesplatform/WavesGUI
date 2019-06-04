(function () {
    'use strict';

    /**
     * @param {typeof Base} Base
     * @param {Promise<typeof OrderListItem>} promise
     */
    const service = function (Base, promise) {

        return promise
            .then(OrderListItem => {

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
                    /**
                     * @type {boolean}
                     * @private
                     */
                    _fromTop;


                    constructor(params) {
                        super();
                        this._fillColor = params.fillColor;
                        this._fromTop = params.fromTop;
                        this._createCanvas(params.node);
                        this._createLines(params.node);
                    }

                    render(data) {
                        this._initSize();

                        const widthList = [];

                        const loop = (data, i) => {
                            this._rows[i].render(data);
                            widthList[i] = data && data.width || 0;
                        };

                        if (this._fromTop) {
                            for (let i = this._rows.length - 1; i > 0; i--) {
                                loop(data[this._rows.length - 1 - i], i);
                            }
                        } else {
                            for (let i = 0; i < this._rows.length - 1; i++) {
                                loop(data[i], i);
                            }
                        }

                        this._drawCanvas(widthList);
                    }

                    /**
                     * @param node
                     * @private
                     */
                    _createLines(node) {
                        for (let i = 0; i < 100; i++) {
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

                }

                return OrderList;
            });
    };

    service.$inject = ['Base', 'OrderListItem'];

    angular.module('app.dex').service('OrderList', service);
})();

(function () {
    'use strict';

    /**
     * @param Base
     * @return {Chart}
     */
    const factory = function (Base) {

        const { Money } = require('@waves/data-entities');
        const tsUtils = require('ts-utils');

        class ChartFactory extends Base {

            /**
             * @param {JQuery} $element
             * @param {ChartFactory.IOptions} [options]
             * @param {Array} [data]
             */
            constructor($element, options, data) {
                super();

                this.$parent = $element;
                /**
                 * @type {ChartFactory.IOptions}
                 */
                this.options = Object.assign(Object.create(null), ChartFactory.defaultOptions, options);
                /**
                 * @type {Array}
                 */
                this.data = data;
                /**
                 * @type {HTMLCanvasElement}
                 */
                this.canvas = this._initializeCanvasElement($element);
                /**
                 * @type {CanvasRenderingContext2D}
                 */
                this.ctx = this.canvas.getContext('2d');

                this._render();
            }

            setOptions(options) {
                this.options = options;

                this._render();
            }

            setData(data) {
                this.data = data;

                this._render();
            }

            /**
             * @param {JQuery} $element
             * @return {HTMLCanvasElement}
             * @private
             */
            _initializeCanvasElement($element) {
                const canvas = document.createElement('canvas');
                canvas.style.position = 'absolute';
                canvas.style.left = '0';
                canvas.style.top = '0';

                if ($element.css('position') === 'static') {
                    $element.css('position', 'relative');
                }

                $element.append(canvas);
                canvas.width = $element.width();
                canvas.height = $element.height();
                return canvas;
            }

            _clear() {
                this._clearCanvas();
            }

            _clearCanvas() {
                this.canvas.width = this.canvas.width;
            }

            _render() {
                this._clear();

                if (!this.data || !this.data.length) {
                    return null;
                }

                if (!this.options.charts || !this.options.charts.length) {
                    return null;
                }

                const data = this._getChartData();

                data.forEach(item => {
                    this._drawChart(item);
                });
            }

            /**
             * @param {ChartFactory._IChartData} data
             * @private
             */
            _drawChart(data) {

                this.ctx.strokeStyle = data.lineColor;

                this.ctx.lineWidth = data.lineWidth;

                const first = data.coordinates[0];
                this.ctx.moveTo(first.x, first.y);

                data.coordinates.forEach(({ x, y }) => {
                    this.ctx.lineTo(x, y);
                });

                this.ctx.stroke();

                if (data.fillColor) {
                    this.ctx.fillStyle = data.fillColor;
                    if (data.gradientColor) {
                        const grd = this.ctx.createLinearGradient(0, 0, 0, data.height.toNumber());
                        grd.addColorStop(0, data.gradientColor[0]);
                        grd.addColorStop(1, data.gradientColor[1]);
                        this.ctx.fillStyle = grd;
                    } else {
                        this.ctx.fillStyle = data.fillColor;
                    }
                    const last = data.coordinates[data.coordinates.length - 1];
                    this.ctx.lineTo(last.x, data.height.toNumber());
                    this.ctx.lineTo(first.x, data.height.toNumber());
                    this.ctx.lineTo(first.x, first.y);

                    this.ctx.fill();
                }
            }

            _getChartData() {
                const height = new BigNumber(this.canvas.height);
                const width = new BigNumber(this.canvas.width);
                const maxChartHeight = height.times(0.9);

                return this.options.charts.map(chartOptions => {
                    const xValues = [];
                    const yValues = [];

                    this.data.forEach(item => {
                        const x = ChartFactory._getValues(item[chartOptions.axisX]);
                        const y = ChartFactory._getValues(item[chartOptions.axisY]);

                        if (tsUtils.isNotEmpty(x) && tsUtils.isNotEmpty(y)) {
                            xValues.push(x);
                            yValues.push(y);
                        }
                    });


                    const xMin = BigNumber.min(...xValues);
                    const xMax = BigNumber.max(...xValues);
                    const yMin = BigNumber.min(...yValues);
                    const yMax = BigNumber.max(...yValues);
                    const xDelta = xMax.minus(xMin);
                    const yDelta = yMax.minus(yMin);
                    const xFactor = width.div(xDelta);
                    const yFactor = maxChartHeight.div(yDelta);

                    const coordinates = [];

                    for (let i = 0; i < xValues.length; i++) {
                        const xValue = xValues[i];
                        const yValue = yValues[i];

                        const x = xValue.minus(xMin).times(xFactor).toNumber();
                        const y = height.minus(yValue.minus(yMin).times(yFactor)).toNumber();

                        coordinates.push({ x, y });
                    }

                    return {
                        height,
                        maxChartHeight,
                        width,
                        xValues,
                        yValues,
                        xMin,
                        xMax,
                        yMin,
                        yMax,
                        xDelta,
                        yDelta,
                        xFactor,
                        yFactor,
                        coordinates,
                        length: coordinates.length,
                        ...chartOptions
                    };
                });
            }

            static defaultOptions = {
                charts: [
                    {
                        axisX: 'timestamp',
                        axisY: 'rate',
                        lineColor: '#ef4829',
                        fillColor: '#FFF',
                        gradientColor: false,
                        lineWidth: 2
                    }
                ]
            };

            /**
             * @param item
             * @return {BigNumber}
             * @private
             */
            static _getValues(item) {
                switch (true) {
                    case item instanceof Date:
                        return new BigNumber(item.getTime());
                    case item instanceof Money:
                        return item.getTokens();
                    case item instanceof BigNumber:
                        return item;
                    case typeof item === 'number':
                        return new BigNumber(item);
                    default:
                        throw new Error('Wrong value type!');
                }
            }

        }

        return ChartFactory;
    };

    factory.$inject = ['Base', 'utils'];

    angular.module('app.ui').factory('ChartFactory', factory);
})();

/**
 * @name ChartFactory
 */

/**
 * @typedef {object} ChartFactory#IOptions
 * @property {ChartFactory.IChart[]} charts
 */

/**
 * @typedef {object} ChartFactory#IChart
 * @property {string} axisX
 * @property {string} axisY
 * @property {string} lineColor
 * @property {string} [fillColor]
 * @property {array} gradientColor
 */

/**
 * @typedef {object} ChartFactory#_IChartData
 * @property {BigNumber} height
 * @property {BigNumber} maxChartHeight
 * @property {BigNumber} width
 * @property {BigNumber[]} xValues
 * @property {BigNumber[]} yValues
 * @property {BigNumber} xMin
 * @property {BigNumber} xMax
 * @property {BigNumber} yMin
 * @property {BigNumber} yMax
 * @property {BigNumber} xDelta
 * @property {BigNumber} yDelta
 * @property {BigNumber} xFactor
 * @property {BigNumber} yFactor
 * @property {Array<{x: number, y: number}>} coordinates
 * @property {number} length
 * @property {string} axisX
 * @property {string} axisY
 * @property {string} lineColor
 * @property {string} [fillColor]
 * @property {array} gradientColor
 */

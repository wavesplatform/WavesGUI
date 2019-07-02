(function () {
    'use strict';

    /**
     * @param Base
     * @return {Chart}
     */
    const factory = function (Base) {

        const { Money } = require('@waves/data-entities');
        const tsUtils = require('ts-utils');
        const SCALE = devicePixelRatio || 1;
        const SELECTORS = {
            platePrice: '.chart-plate__price',
            plateDate: '.chart-plate__date',
            plateTime: '.chart-plate__time'
        };

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
                this._createPlateAndMarker();
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
                const width = Math.round($element.width());
                const height = Math.round($element.height());

                canvas.style.position = 'absolute';
                canvas.style.left = '0';
                canvas.style.top = '0';
                canvas.style.width = `${width}px`;
                canvas.style.height = `${height}px`;

                if ($element.css('position') === 'static') {
                    $element.css('position', 'relative');
                }

                $element.append(canvas);
                canvas.width = width * SCALE;
                canvas.height = height * SCALE;
                return canvas;
            }

            _setSize(width, height) {
                this.canvas.width = width;
                this.canvas.height = height;
                this.canvas.style.width = `${width}px`;
                this.canvas.style.height = `${height}px`;
                this._render();
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

                this.chartData = this._getChartData();

                this.chartData.forEach(item => {
                    this._drawChart(item);
                });
                this._initMouseActions();
            }

            /**
             * @param {ChartFactory._IChartData} data
             * @private
             */
            _drawChart(data) {

                this.ctx.strokeStyle = data.lineColor;
                this.ctx.lineWidth = data.lineWidth * SCALE;
                const first = data.coordinates[0];
                this.ctx.moveTo(first.x, first.y);
                data.coordinates.forEach(({ x, y }, i) => {
                    const j = i === (data.coordinates.length - 1) ? i : i + 1;
                    const xc = (data.coordinates[i].x + data.coordinates[j].x) / 2;
                    const yc = (data.coordinates[i].y + data.coordinates[j].y) / 2;
                    this.ctx.quadraticCurveTo(x, y, xc, yc);
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

            /**
             * @private
             */
            _getChartData() {
                const height = new BigNumber(this.canvas.height);
                const width = new BigNumber(this.canvas.width);
                const maxChartHeight = height.times(0.8);

                return this.options.charts.map(chartOptions => {
                    const marginBottom = new BigNumber(chartOptions.marginBottom);
                    const xValues = [];
                    const yValues = [];
                    const dates = [];

                    this.data.forEach(item => {
                        const itemX = item[chartOptions.axisX];
                        if (itemX instanceof Date) {
                            dates.push(itemX);
                        }
                        const x = ChartFactory._getValues(itemX);
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
                        const y = height.minus(yValue.minus(yMin).times(yFactor)).toNumber() - marginBottom;

                        coordinates.push({ x, y });
                    }

                    return {
                        height,
                        maxChartHeight,
                        width,
                        dates,
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
                        lineWidth: 2,
                        marginBottom: 0
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


            _initMouseActions() {
                const omMouseMove = event => {
                    const coords = this.chartData[0].coordinates;
                    const diff = coords[1].x - coords[0].x;
                    coords.forEach(({ x, y }, i) => {
                        if (Math.abs(event.offsetX - x) <= (diff / 2)) {
                            this._fillPlate(i);
                            this._setMarkerAndPlatePosition(event, x, y);
                        }
                    });
                };

                const onMouseLeave = () => {
                    this.plate.removeClass('visible');
                    this.marker.removeClass('visible');
                };

                const onResize = () => {
                    this.$parent.off();
                    this._setSize(this.$parent.outerWidth(), this.$parent.outerHeight());
                    this._render();
                    this.$parent.on('mousemove', omMouseMove);
                };

                this.$parent.on('mousemove', omMouseMove);

                this.$parent.on('mouseleave', onMouseLeave);

                this.listenEventEmitter($(window), 'resize', onResize);
            }

            /**
             * @param i
             * @private
             */
            _fillPlate(i) {
                this.plate.find(SELECTORS.platePrice).html(this.chartData[0].yValues[i].toFormat());
                this.plate.find(SELECTORS.plateDate).html(this.chartData[0].dates[i].toLocaleDateString());
                this.plate.find(SELECTORS.plateTime)
                    .html(this.chartData[0].dates[i].toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            }

            _setMarkerAndPlatePosition(event, x, y) {
                const PLATE_ARROW_WIDTH = 5;
                const markerX = x - (this.marker.outerWidth() / 2);
                const markerY = y - (this.marker.outerHeight() / 2);
                let plateX;
                if (event.offsetX < (window.innerWidth / 2)) {
                    plateX = x + (this.marker.outerWidth() / 2) + PLATE_ARROW_WIDTH;
                    this.plate.addClass('to-right');
                } else {
                    plateX = markerX - this.plate.outerWidth() - PLATE_ARROW_WIDTH;
                    this.plate.removeClass('to-right');
                }
                const plateY = y - (this.plate.outerHeight() / 2);
                this.plate.css('transform', `translate(${plateX}px,${plateY}px)`);
                this.marker.css('transform', `translate(${markerX}px,${markerY}px)`);
                this.plate.addClass('visible');
                this.marker.addClass('visible');
            }

            /**
             * @private
             */
            _createPlateAndMarker() {
                this.plate = $('<div class="chart-plate">' +
                    '<div class="chart-plate__price"></div>' +
                    '<div class="chart-plate__timestamp headline-4">' +
                    '<span class="chart-plate__date"></span><span class="chart-plate__time"></span>' +
                    '</div>' +
                    '</div>');

                this.marker = $('<div class="chart-plate__marker"</div>');

                this.$parent.append([this.plate, this.marker]);
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
 * @property {number} marginBottom
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
 * @property {number} lineWidth
 * @property {string} axisX
 * @property {string} axisY
 * @property {string} lineColor
 * @property {string} [fillColor]
 * @property {array} gradientColor
 */

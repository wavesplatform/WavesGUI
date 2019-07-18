(function () {
    'use strict';

    /**
     * @param Base
     * @param utils
     * @param user
     * @return {ChartFactory}
     */
    const factory = function (Base, user, utils) {

        const { Money } = require('@waves/data-entities');
        const { equals, isEmpty, range, last, head } = require('ramda');
        const tsUtils = require('ts-utils');
        const { BigNumber } = require('@waves/bignumber');
        const SCALE = devicePixelRatio || 1;

        class ChartFactory extends Base {

            changeLanguageHandler = () => this._setAxisCoords();

            /**
             * @private
             * @type {object}
             */
            legendItemsObjects;

            /**
             * @param {JQuery} $element
             * @param {ChartFactory.IOptions} options
             * @param {Object<string, array>} data
             */
            constructor($element, options, data) {
                super();

                /**
                 * @type {JQuery}
                 */
                this.$parent = $element;
                /**
                 * @type {ChartFactory.IOptions}
                 */
                this.options = Object.assign(Object.create(null), ChartFactory.defaultOptions, options);
                /**
                 * @type {object<string, Array<object<string, number>>}
                 */
                this.data = data;
                /**
                 * @type {HTMLCanvasElement}
                 */
                this.canvas = ChartFactory._initializeCanvasElement($element);
                /**
                 * @type {CanvasRenderingContext2D}
                 */
                this.ctx = this.canvas.getContext('2d');
                /**
                 * @type {object}
                 * @private
                 */
                this._lastEvent = Object.create(null);

                this._render();

                /**
                 * @type {Signal<any>}
                 */
                this.mouseSignal = new tsUtils.Signal();

                const checkInterval = this.options.checkWidth;

                if (checkInterval) {
                    setInterval(() => {
                        if (this.canvas.width !== this.$parent.outerWidth() ||
                            this.canvas.height !== this.$parent.outerHeight()
                        ) {
                            this._setSize(this.$parent.outerWidth(), this.$parent.outerHeight());
                        }
                    }, typeof checkInterval === 'number' ? checkInterval : 1000);
                }

            }

            get mouse() {
                return this.mouseSignal;
            }

            /**
             * @param {ChartFactory.IOptions} options
             */
            setOptions(options) {
                this.options = Object.assign(Object.create(null), ChartFactory.defaultOptions, options);

                this._render();
            }

            /**
             * @param {Object<string, array>} data
             */
            setData(data) {
                this.data = data;
                this._render();
            }

            /**
             * @param {JQuery} $element
             * @return {HTMLCanvasElement}
             * @private
             */
            static _initializeCanvasElement($element) {
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

            /**
             * @param width @type {number}
             * @param height @type {number}
             * @private
             */
            _setSize(width, height) {
                this.canvas.width = width * SCALE;
                this.canvas.height = height * SCALE;
                this.canvas.style.width = `${width}px`;
                this.canvas.style.height = `${height}px`;
                this._render();
            }

            /**
             * @private
             */
            _clear() {
                this._clearCanvas();
            }

            /**
             * @private
             */
            _clearCanvas() {
                this.canvas.width = this.canvas.width;
            }

            /**
             * @private
             */
            _render() {
                this._clear();

                const keys = this.data && Object.keys(this.data);
                const hasData = keys && keys.length && keys.some(id => this.data[id].length);
                if (!hasData) {
                    return null;
                }

                if (!this.options) {
                    return null;
                }

                this.chartData = this._getChartData(this.data);

                this._drawChart(this.chartData);

                if (this.options.hasDates) {
                    if (!this.legendItemsObjects) {
                        this._createBottomLegend(this._getLegendItemsWithCoords());
                    }
                    this._updateLegendObject();
                }

                if (this.options.hasMouseEvents) {
                    this._initActions();
                }
            }

            /**
             * @param {ChartFactory.IChartData} data
             * @private
             */
            _drawChart(data) {
                const { ctx, options } = this;

                Object.entries(data.coordinates).forEach(([id, chartCoords]) => {
                    const viewOptions = options.view[id];
                    const first = chartCoords[0];

                    ctx.strokeStyle = viewOptions.lineColor;
                    ctx.lineWidth = viewOptions.lineWidth * SCALE;

                    ctx.beginPath();
                    ctx.moveTo(first.x, first.y);
                    chartCoords.forEach(({ x, y }) => {
                        ctx.lineTo(x, y);
                    });

                    ctx.stroke();

                    if (viewOptions.fillColor) {
                        ctx.fillStyle = viewOptions.fillColor;
                        if (viewOptions.gradientColor) {
                            const grd = ctx.createLinearGradient(0, 0, 0, data.height.toNumber());
                            grd.addColorStop(0, viewOptions.gradientColor[0]);
                            grd.addColorStop(1, viewOptions.gradientColor[1]);
                            ctx.fillStyle = grd;
                        } else {
                            ctx.fillStyle = viewOptions.fillColor;
                        }
                        const last = chartCoords[chartCoords.length - 1];
                        ctx.lineTo(last.x, data.height.toNumber());
                        ctx.lineTo(first.x, data.height.toNumber());
                        ctx.lineTo(first.x, first.y);

                        ctx.fill();
                    }
                });
            }

            /**
             * @param {object<string, Array<object<string, number>>} data
             * @return {ChartFactory.IChartData}
             * @private
             */
            _getChartData(data) {
                const height = new BigNumber(this.canvas.height);
                const width = new BigNumber(this.canvas.width);
                const maxChartHeight = height.mul(this.options.heightFactor);

                // TODO завязать отступ снизу на коэффициент

                const marginBottom = this.options.marginBottom;
                const xValues = {};
                const yValues = {};

                Object.entries(data).forEach(([id, chart]) => {
                    xValues[id] = [];
                    yValues[id] = [];

                    chart.forEach(item => {
                        const itemX = item[this.options.axisX];
                        const itemY = item[this.options.axisY];

                        const x = ChartFactory._getValues(itemX);
                        const y = ChartFactory._getValues(itemY);

                        if (tsUtils.isNotEmpty(x) && tsUtils.isNotEmpty(y)) {
                            xValues[id].push(x);
                            yValues[id].push(y);
                        }
                    });
                });

                const combinedXValues = Array.prototype.concat(
                    ...Object.keys(xValues).map(key => xValues[key])
                );
                const combinedYValues = Array.prototype.concat(
                    ...Object.keys(xValues).map(key => yValues[key])
                );
                const xMin = BigNumber.min(...combinedXValues);
                const xMax = BigNumber.max(...combinedXValues);
                const yMin = BigNumber.min(...combinedYValues);
                const yMax = BigNumber.max(...combinedYValues);
                const xDelta = xMax.sub(xMin);
                const yDelta = yMax.sub(yMin);
                const xFactor = width.div(xDelta);
                const yFactor = maxChartHeight.div(yDelta);

                const coordinates = [];

                Object.entries(xValues).forEach(([id, values]) => {
                    coordinates[id] = [];
                    values.forEach((value, i) => {
                        const xValue = value;
                        const yValue = yValues[id][i];
                        const x = Number(xValue.sub(xMin).mul(xFactor).toFixed());
                        const y = Number(height.sub(yValue.sub(yMin).mul(yFactor)).toFixed()) - marginBottom * SCALE;

                        coordinates[id].push({ x, y });
                    });
                });

                return ({
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
                    coordinates
                });
            }

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

            /**
             * @private
             */
            _initActions() {
                this.$parent.off();
                const onMouseMove = mouseOrTouchEvent => {
                    const event = utils.getEventInfo(mouseOrTouchEvent);
                    this._findIntersection(event);
                };

                const onMouseLeave = event => {
                    this.mouseSignal.dispatch(ChartFactory._getMouseEvent({ event }));
                    this._lastEvent = Object.create(null);
                };

                const onResize = () => {
                    this.$parent.off();
                    this._setSize(this.$parent.outerWidth(), this.$parent.outerHeight());
                    this.$parent.on('mousemove', onMouseMove);
                    this.$parent.on('mouseleave', onMouseLeave);
                };

                this.$parent.on('mousemove', onMouseMove);
                this.$parent.on('mouseleave', onMouseLeave);

                this.listenEventEmitter($(window), 'resize', utils.debounceRequestAnimationFrame(() => onResize()));
            }

            /**
             * @param event
             * @return {{leave: boolean}}
             * @private
             */
            static _getMouseEvent(event) {
                return {
                    ...event,
                    leave: !event.x || !event.y
                };
            }

            /**
             * @param event
             * @private
             */
            _findIntersection(event) {
                const coords = Object.entries(this.chartData.coordinates).reduce((acc, [id, coords]) => {
                    acc[id] = coords
                        .map(item => item)
                        .sort(({ x: a }, { x: b }) => a - b);
                    return acc;
                }, Object.create(null));

                const binarySearch = (data, target, start, end) => {
                    if (end < 1) {
                        return data[0];
                    }
                    if ((end - 1) === start) {
                        const endClosest = Math.abs(data[start].x - target) > Math.abs(data[end].x - target);
                        return endClosest ? data[end] : data[start];
                    }

                    const middle = Math.floor((start + (end - start) / 2));
                    if (target === data[middle].x) {
                        return data[middle];
                    }
                    if (target > data[middle].x) {
                        return binarySearch(data, target, middle, end);
                    }
                    if (target < data[middle].x) {
                        return binarySearch(data, target, start, middle);
                    }
                };

                const closestPointsForEachChart = Object.entries(coords)
                    .reduce((acc, [id, coords]) => {
                        acc[id] = binarySearch(coords, event.offsetX, 0, coords.length - 1);
                        return acc;
                    }, Object.create(null));

                const xDistances = Object.keys(closestPointsForEachChart).map(key => {
                    const coord = closestPointsForEachChart[key];
                    return Math.abs(coord.x - event.offsetX);
                });
                const minXDistance = Math.min(...xDistances);

                const closestPoints = Object.entries(closestPointsForEachChart).reduce((acc, [id, coord]) => {
                    if ((coord.x - event.offsetX) === minXDistance) {
                        acc[id] = coord;
                    }
                    return acc;
                }, Object.create(null));

                if (Object.keys(closestPoints).length) {
                    Object.entries(closestPoints).forEach(([id, point]) => {
                        if (!equals(this._lastEvent, point)) {
                            const { x, y } = point;
                            const i = this.chartData.coordinates[id].findIndex(coord => coord.x === x && coord.y === y);
                            this._dispatchMouseMove(x, y, i, event, id);
                        }
                        if (isEmpty(this._lastEvent)) {
                            this._lastEvent = point;
                        }
                    });
                }
            }

            /**
             * @param x @type {number}
             * @param y @type {number}
             * @param i @type {number}
             * @param event @type {object}
             * @private
             */
            _dispatchMouseMove(x, y, i, event, id) {
                this.mouseSignal.dispatch(ChartFactory._getMouseEvent({
                    event,
                    x,
                    y,
                    id,
                    xValue: this.chartData.xValues[id][i],
                    yValue: this.chartData.yValues[id][i]
                }));
                this._lastEvent = { x, y };
            }

            /**
             * @return {Array}
             * @private
             */
            _getLegendItemsWithCoords() {
                const width = this.$parent.outerWidth() / 4;
                const exactCoords = range(0, 4).map(i => {
                    return width * i + width / 2;
                });

                const combinedCoordinates = Array.prototype.concat(
                    ...Object.keys(this.chartData.coordinates).map(key => this.chartData.coordinates[key])
                );
                const xCoords = combinedCoordinates.map(({ x }) => x);
                const combinedXValues = Array.prototype.concat(
                    ...Object.keys(this.chartData.xValues).map(key => this.chartData.xValues[key])
                );

                return exactCoords.map(x => {
                    return xCoords.reduce((prevXCoord, currentXCoord) => {
                        if (Math.abs(currentXCoord / SCALE - x) < Math.abs(prevXCoord / SCALE - x)) {
                            return currentXCoord;
                        } else {
                            return prevXCoord;
                        }
                    });
                }).map(foundX => {
                    const dateIndex = combinedCoordinates.findIndex(({ x }) => foundX === x);
                    return {
                        coords: foundX / SCALE,
                        value: new Date(combinedXValues[dateIndex].toNumber())
                    };
                });
            }

            /**
             * @param axisItemsWithCoords @type {Array}
             * @private
             */
            _createBottomLegend(axisItemsWithCoords) {
                this.legendItemsObjects = axisItemsWithCoords.map(({ value, x }) => {
                    const $legendItem = $(`<div class="chart-legend">${ChartFactory._localDate(value)}</div>`);
                    this.$parent.append($legendItem);
                    const coords = Math.round(x - $legendItem.width() / 2);
                    $legendItem.css({ left: coords });
                    return {
                        $legendItem,
                        legendValue: value,
                        coords
                    };
                });

                i18next.on('languageChanged', this.changeLanguageHandler);
            }

            /**
             * @private
             */
            _updateLegendObject() {
                const newCoords = this._getLegendItemsWithCoords();
                this.legendItemsObjects = this.legendItemsObjects.map((object, i) => ({
                    $legendItem: object.$legendItem,
                    legendValue: newCoords[i].value,
                    coords: newCoords[i].coords
                }));
                this._setAxisCoords();
            }

            /**
             * @private
             */
            _setAxisCoords() {
                const twoDays = 24 * 60 * 60 * 1000 * 2;
                const isTime = last(this.legendItemsObjects).legendValue - head(this.legendItemsObjects).legendValue <
                    twoDays;

                this.legendItemsObjects.forEach(object => {
                    const legendDate = isTime ?
                        tsUtils.date('hh:mm')(object.legendValue) :
                        ChartFactory._localDate(object.legendValue);

                    object.$legendItem
                        .html(legendDate)
                        .css({
                            left: object.coords
                        });
                });
            }

            /**
             * @param date @type {Date}
             * @param hasYear @type {boolean}
             * @return {string}
             * @private
             */
            static _localDate(date, hasYear = false) {
                return hasYear ? tsUtils.date('DD.MM.YYYY')(date) : tsUtils.date('DD.MM')(date);
            }

            static defaultOptions = {
                axisX: 'timestamp',
                axisY: 'rate',
                marginBottom: 0,
                hasMouseEvents: false,
                hasDates: false,
                checkWidth: false,
                heightFactor: 0.9,
                view: {
                    rate: {
                        lineColor: '#ef4829',
                        fillColor: '#FFF',
                        gradientColor: false,
                        lineWidth: 2
                    }
                }
            };

        }

        return ChartFactory;
    };

    factory.$inject = ['Base', 'user', 'utils'];

    angular.module('app.ui').factory('ChartFactory', factory);
})();

/**
 * @name ChartFactory
 */

/**
 * @typedef {object} ChartFactory#IOptions
 * @property {string} axisX
 * @property {string} axisY
 * @property {boolean | number} checkWidth
 * @property {number} marginBottom
 * @property {boolean} hasMouseEvents
 * @property {boolean} hasDates
 * @property {number} heightFactor
 * @property {Object<string, ChartFactory.IViewChart>} view
 */

/**
 * @typedef {object} ChartFactory#IViewChart
 * @property {string} lineColor
 * @property {string} [fillColor]
 * @property {array} gradientColor
 * @property {number} lineWidth
 */

/**
 * @typedef {object} ChartFactory#IChartData
 * @property {BigNumber} height
 * @property {BigNumber} maxChartHeight
 * @property {BigNumber} width
 * @property {Array<BigNumber[]>} xValues
 * @property {Array<BigNumber[]>} yValues
 * @property {BigNumber} xMin
 * @property {BigNumber} xMax
 * @property {BigNumber} yMin
 * @property {BigNumber} yMax
 * @property {BigNumber} xDelta
 * @property {BigNumber} yDelta
 * @property {BigNumber} xFactor
 * @property {BigNumber} yFactor
 * @property {Array<ICoords[]>} coordinates
 */

/**
 * @typedef {object} ChartFactory#ICoords
 * @property {number} x
 * @property {number} y
 */

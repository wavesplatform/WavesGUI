(function () {
    'use strict';

    /**
     * @param {typeof Base} Base
     * @param utils
     * @param user
     * @return {ChartFactory}
     */
    const factory = function (Base, utils, createPoll) {

        const { Money } = require('@waves/data-entities');
        const { equals, isEmpty, range, last, head, pipe, not, prop, allPass } = require('ramda');
        const { Signal } = require('ts-utils');
        const { BigNumber } = require('@waves/bignumber');
        const SCALE = devicePixelRatio || 1;

        const isNotEmptyPoint = pipe(
            allPass([
                pipe(prop('x'), isEmpty, not),
                pipe(prop('y'), isEmpty, not)
            ])
        );

        class ChartFactory extends Base {

            changeLanguageHandler = () => this._setAxisCoords();

            /**
             * @private
             * @type {object}
             */
            legendItemsObjects;
            /**
             * @type {HTMLCanvasElement}
             */
            canvas;

            /**
             * @param {JQuery} $element
             * @param {ChartFactory.IOptions} options
             * @param {Object<string, array>} data
             */
            constructor($element, options, data) {
                super();

                this.signals = Object.assign(this.signals, {
                    mouseMove: new Signal(),
                    mouseLeave: new Signal()
                });
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
                this._initializeCanvasElement($element);
                /**
                 * @type {CanvasRenderingContext2D}
                 */
                this.ctx = this.canvas.getContext('2d');
                /**
                 * @type {object}
                 * @private
                 */
                this._lastEvent = null;
                const checkInterval = this.options.checkWidth;

                if (checkInterval) {
                    const interval = typeof checkInterval === 'number' && checkInterval || 1000;
                    createPoll(this, () => null, this._checkAndUpdateSize, interval);
                }

                this._render();
                this._setHandlers();
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
                if (this._lastEvent) {
                    this._findIntersection(this._lastEvent.event);
                }
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

                if ($element.css('position') === 'static') {
                    $element.css('position', 'relative');
                }

                $element.append(canvas);
                this.canvas = canvas;
                this._setSize(width, height);
            }

            /**
             * @private
             */
            _setHandlers() {
                const onMouseMove = utils.debounceRequestAnimationFrame(mouseOrTouchEvent => {
                    const event = utils.getEventInfo(mouseOrTouchEvent);
                    this._findIntersection(event);
                });

                const onMouseLeave = utils.debounceRequestAnimationFrame(event => {
                    this.signals.mouseLeave.dispatch({ event });
                    this._lastEvent = null;
                });

                const onResize = utils.debounceRequestAnimationFrame(() => {
                    this._checkAndUpdateSize();
                });

                this.listenEventEmitter(this.$parent, 'mousemove', onMouseMove);
                this.listenEventEmitter(this.$parent, 'mouseleave', onMouseLeave);
                this.listenEventEmitter(window, 'resize', onResize, {
                    on: 'addEventListener',
                    off: 'removeEventListener'
                });
            }

            /**
             * @private
             */
            _checkAndUpdateSize() {
                const width = this.canvas.width;
                if (width !== this.$parent.outerWidth() || this.canvas.height !== this.$parent.outerHeight()) {
                    this._setSize(this.$parent.outerWidth(), this.$parent.outerHeight());
                    this._render();
                    if (this._lastEvent) {
                        this.signals.mouseMove.dispatch(this._lastEvent);
                    }
                }
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
            }

            /**
             * @private
             */
            _clear() {
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
                const min = { x: new BigNumber(Infinity), y: new BigNumber(Infinity) };
                const max = { x: new BigNumber(-Infinity), y: new BigNumber(-Infinity) };

                const pointsHash = Object.entries(data).reduce((acc, [id, chart]) => {
                    const points = acc[id] = [];

                    chart.forEach(item => {
                        const itemX = item[this.options.axisX];
                        const itemY = item[this.options.axisY];

                        const point = { x: ChartFactory._getValues(itemX), y: ChartFactory._getValues(itemY) };

                        if (isNotEmptyPoint(point)) {
                            min.x = BigNumber.min(min.x, point.x);
                            min.y = BigNumber.min(min.y, point.y);
                            max.x = BigNumber.max(max.x, point.x);
                            max.y = BigNumber.max(max.y, point.y);
                            points.push(point);
                        }

                        points.sort(utils.comparators.process(prop('x')).bigNumber.asc);
                    });

                    return acc;
                }, Object.create(null));

                const delta = { x: max.x.sub(min.x), y: max.y.sub(min.y) };
                const factor = { x: width.div(delta.x), y: maxChartHeight.div(delta.y) };
                const coordinates = Object.create(null);

                Object.entries(pointsHash).forEach(([id, points]) => {
                    coordinates[id] = [];
                    points.forEach(value => {
                        const xValue = value.x;
                        const yValue = value.y;
                        const x = Number(xValue.sub(min.x).mul(factor.x).toFixed());
                        const y = Number(height.sub(yValue.sub(min.y).mul(factor.y)).toFixed()) - marginBottom * SCALE;

                        coordinates[id].push({
                            x,
                            y,
                            xValue,
                            yValue
                        });
                    });
                });

                return ({
                    height,
                    maxChartHeight,
                    width,
                    min,
                    max,
                    delta,
                    factor,
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
             * @param event
             * @private
             * TODO Rename and refactor method
             */
            _findIntersection(event) {
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

                if (!this.chartData && !this.chartData.coordinates) {
                    return null;
                }

                const intersection = Object.entries(this.chartData.coordinates)
                    .reduce((acc, [id, points]) => {
                        const offsetX = event.pageX - $(event.target).offset().left;
                        const point = binarySearch(points, offsetX * SCALE, 0, points.length - 1);
                        const data = {
                            id, point, event
                        };

                        if (
                            !acc ||
                            Math.abs(point.x - offsetX * SCALE) < Math.abs(acc.point.x - offsetX * SCALE)
                        ) {
                            return data;
                        } else {
                            return acc;
                        }
                    }, null);

                if (intersection) {
                    this._dispatchMouseMove(intersection);
                }
            }

            /**
             * @param {*} intersection
             * @private
             */
            _dispatchMouseMove(intersection) {
                if (!this._lastEvent || !equals(this._lastEvent.point, intersection.point)) {
                    // TODO Add support legend for many charts
                    this.signals.mouseMove.dispatch(intersection);
                    this._lastEvent = intersection;
                }
            }

            /**
             * @return {Array}
             * @private
             */
            _getLegendItemsWithCoords() {
                const width = this.$parent.outerWidth() / 4; // TODO Почему 4?
                const exactCoords = range(0, 4).map(i => {
                    return width * i + width / 2;
                });

                const combinedCoordinates = Array.prototype.concat(
                    ...Object.keys(this.chartData.coordinates).map(key => this.chartData.coordinates[key])
                );
                const xCoords = combinedCoordinates.map(prop('x'));
                const combinedXValues = combinedCoordinates.map(prop('xValue'));

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

                this.listenEventEmitter(i18next, 'languageChanged', this.changeLanguageHandler);
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

    factory.$inject = ['Base', 'utils', 'createPoll'];

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
 * @property {{x: BigNumber, y: BigNumber}} max
 * @property {{x: BigNumber, y: BigNumber}} min
 * @property {{x: BigNumber, y: BigNumber}} delta
 * @property {{x: BigNumber, y: BigNumber}} factor
 * @property {Array<ChartFactory.ICoords[]>} coordinates
 */

/**
 * @typedef {object} ChartFactory#ICoords
 * @property {number} x
 * @property {number} y
 * @property {number} xValue
 * @property {number} yValue
 */

/**
 * @typedef {object} ChartFactory#IPair
 * @property {number} x
 * @property {number} y
 */

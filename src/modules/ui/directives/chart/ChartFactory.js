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
                this.canvas = ChartFactory._initializeCanvasElement($element);
                /**
                 * @type {CanvasRenderingContext2D}
                 */
                this.ctx = this.canvas.getContext('2d');

                /**
                 * @type {Object}
                 * @private
                 */
                this._lastEvent = Object.create(null);

                this._render();

                this.mouseSignal = new tsUtils.Signal();

                const checkInterval = this.options.checkWidth;

                if (checkInterval) {
                    setInterval(() => {
                        if (this.canvas.width !== this.$parent.outerWidth()) {
                            this._setSize(this.$parent.outerWidth(), this.$parent.outerHeight());
                        }
                    }, typeof checkInterval === 'number' ? checkInterval : 1000);
                }

            }

            get mouse() {
                return this.mouseSignal;
            }

            /**
             * @param options @type {Object}
             */
            setOptions(options) {
                this.options = options;

                this._render();
            }

            /**
             * @param data @type {Object}
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

                if (!this.data || !this.data.length) {
                    return null;
                }

                if (!this.options) {
                    return null;
                }

                this.chartData = this._getChartData();

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
             * @param {ChartFactory._IChartData} data
             * @private
             */
            _drawChart(data) {
                this.ctx.strokeStyle = data.lineColor;
                this.ctx.lineWidth = data.lineWidth * SCALE;
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

            /**
             * @private
             */
            _getChartData() {
                const height = new BigNumber(this.canvas.height);
                const width = new BigNumber(this.canvas.width);
                const maxChartHeight = height.times(0.7);

                // TODO завязать отступ снизу на коэффициент

                const marginBottom = this.options.marginBottom;
                const xValues = [];
                const yValues = [];

                this.data.forEach(item => {
                    const itemX = item[this.options.axisX];
                    const itemY = item[this.options.axisY];

                    const x = ChartFactory._getValues(itemX);
                    const y = ChartFactory._getValues(itemY);

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
                    const y = height.minus(yValue.minus(yMin).times(yFactor)).toNumber() - marginBottom * SCALE;

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
                    ...this.options
                };
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
                    const coords = this.chartData.coordinates;
                    coords.forEach(this._findIntersection(event).bind(this));
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
             * @return {Function}
             * @private
             */
            _findIntersection(event) {
                return ({ x, y }, i, coords) => {
                    let j;
                    if (i === 0) {
                        return null;
                    } else {
                        j = i - 1;
                    }

                    const diff = (coords[i].x - coords[j].x) / SCALE;
                    const isIntersect = Math.abs(event.offsetX - (x / SCALE)) <= (diff / 2);

                    if (isIntersect) {
                        if (!equals(this._lastEvent, { x, y })) {
                            this._dispatchMouseMove(x, y, i, event);
                        }
                        if (isEmpty(this._lastEvent)) {
                            this._lastEvent = { x, y };
                        }
                    }
                };
            }

            /**
             * @param x @type {number}
             * @param y @type {number}
             * @param i @type {number}
             * @param event @type {Object}
             * @private
             */
            _dispatchMouseMove(x, y, i, event) {
                this.mouseSignal.dispatch(ChartFactory._getMouseEvent({
                    event,
                    x,
                    y,
                    xValue: this.chartData.xValues[i],
                    yValue: this.chartData.yValues[i]
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

                const xCoords = this.chartData.coordinates.map(({ x }) => x);
                return exactCoords.map(x => {
                    return xCoords.reduce((prevXCoord, currentXCoord) => {
                        if (Math.abs(currentXCoord / SCALE - x) < Math.abs(prevXCoord / SCALE - x)) {
                            return currentXCoord;
                        } else {
                            return prevXCoord;
                        }
                    });
                }).map(foundX => {
                    const dateIndex = this.chartData.coordinates.findIndex(({ x }) => foundX === x);
                    return {
                        coords: foundX / SCALE,
                        value: new Date(this.chartData.xValues[dateIndex].toNumber())
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
                lineColor: '#ef4829',
                fillColor: '#FFF',
                gradientColor: false,
                lineWidth: 2,
                marginBottom: 0,
                hasMouseEvents: false,
                hasDates: false,
                checkWidth: false
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

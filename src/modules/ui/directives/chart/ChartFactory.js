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
        const { splitEvery } = require('ramda');
        const tsUtils = require('ts-utils');
        const SCALE = devicePixelRatio || 1;
        const SELECTORS = {
            platePrice: '.chart-plate__price',
            plateDate: '.chart-plate__date',
            plateTime: '.chart-plate__time'
        };

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

                this._render();

                // if (this.options.hasMouseEvents) {
                //     this._createPlateAndMarker();
                // }

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

            _setSize(width, height) {
                this.canvas.width = width * SCALE;
                this.canvas.height = height * SCALE;
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
                const originalX = [];
                const originalY = [];

                this.data.forEach(item => {
                    const itemX = item[this.options.axisX];
                    const itemY = item[this.options.axisY];
                    originalX.push(itemX);
                    originalY.push(itemY);

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
                    originalX,
                    originalY,
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
                    const diff = coords[1].x - coords[0].x;
                    coords.forEach(({ x, y }, i) => {
                        if (Math.abs(event.offsetX - (x / SCALE)) <= (diff / 2)) {
                            // this._fillPlate(i);
                            // this._setMarkerAndPlatePosition(event, x, y);
                            this.mouseSignal.dispatch(ChartFactory._getMouseEvent({
                                event,
                                x,
                                y,
                                xValue: this.chartData.originalX[i],
                                yValue: this.chartData.originalY[i]
                            }));
                        }
                    });
                };

                const onMouseLeave = event => {
                    this.mouseSignal.dispatch(ChartFactory._getMouseEvent({ event }));
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
             * @param i
             * @private
             */
            _fillPlate(i) {
                this.plate.find(SELECTORS.platePrice).html(`$ ${this.chartData.yValues[i].toFormat(2)}`);
                this.plate.find(SELECTORS.plateDate).html(ChartFactory._localDate(this.chartData.originalX[i], true));
                this.plate.find(SELECTORS.plateTime)
                    .html(this.chartData.originalX[i].toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            }

            /**
             * @param event
             * @param x
             * @param y
             * @private
             */
            _setMarkerAndPlatePosition({ offsetX }, x, y) {
                const PLATE_ARROW_WIDTH = 5;
                const scaledX = x / SCALE;
                const scaledY = y / SCALE;
                const markerX = scaledX - (this.marker.outerWidth() / 2);
                const markerY = scaledY - (this.marker.outerHeight() / 2);
                let plateX;
                if (offsetX < (window.innerWidth / 2)) {
                    plateX = scaledX + (this.marker.outerWidth() / 2) + PLATE_ARROW_WIDTH;
                    this.plate.addClass('to-right');
                } else {
                    plateX = markerX - this.plate.outerWidth() - PLATE_ARROW_WIDTH;
                    this.plate.removeClass('to-right');
                }
                const plateY = scaledY - (this.plate.outerHeight() / 2);
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

                this.marker = $('<div class="chart-plate__marker"></div>');

                this.$parent.append([this.plate, this.marker]);
            }

            /**
             * @return {Array}
             * @private
             */
            _getLegendItemsWithCoords() {
                const axisDates = splitEvery(this.data.length / 4, this.data).map(splitted => {
                    return splitted[Math.floor(splitted.length / 2)].timestamp;
                });
                const axisItemsWithCoords = [];

                this.chartData.originalX.forEach((value, i) => {
                    axisDates.forEach(axisDate => {
                        if (axisDate.getTime() === value.getTime()) {
                            axisItemsWithCoords.push({
                                value,
                                coords: Math.round(this.chartData.coordinates[i].x / SCALE)
                            });
                        }
                    });
                });

                return axisItemsWithCoords;
            }

            /**
             * @param axisItemsWithCoords
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
                this.legendItemsObjects.forEach(object => {
                    object.$legendItem
                        .html(ChartFactory._localDate(object.legendValue))
                        .css({
                            left: object.coords
                        });
                });
            }

            /**
             * @param date
             * @param hasYear
             * @return {string}
             * @private
             */
            static _localDate(date, hasYear = false) {
                const userLang = user.getSetting('lng');
                const remapLangs = lang => {
                    switch (lang) {
                        case 'nl_NL':
                            return 'nl';
                        case 'pt_BR':
                            return 'pt';
                        case 'et_EE':
                            return 'est';
                        case 'hi_IN':
                            return 'hi';
                        case 'zh_CN':
                            return 'cn';
                        default:
                            return lang;
                    }
                };
                return date.toLocaleDateString(remapLangs(userLang), {
                    day: 'numeric',
                    month: 'numeric',
                    year: hasYear ? 'numeric' : undefined
                });
            }

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

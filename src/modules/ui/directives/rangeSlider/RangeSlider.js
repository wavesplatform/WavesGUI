(function () {
    'use strict';

    /**
     * @param {JQuery} $element
     * @param {$rootScope.Scope} $scope
     * @param {typeof Base} Base
     * @param {app.utils} utils
     * @param {JQuery} $document
     * @return {RangeSlider}
     */
    const controller = function ($element, $scope, Base, utils, $document) {

        const { range, last, head } = require('ramda');

        class RangeSlider extends Base {

            /**
             * @type {number}
             */
            min;
            /**
             * @type {number}
             */
            max;
            /**
             * @type {number}
             */
            scaleInterval;
            /**
             * @type {number}
             */
            intervals;
            /**
             * @type {number}
             */
            ngModel;
            /**
             * @type {Array<number>}
             */
            _numberValues;
            /**
             * @type {number}
             * @private
             */
            _scale;
            /**
             * @type {JQuery}
             * @private
             */
            _track;
            /**
             * @type {JQuery}
             * @private
             */
            _handle;
            /**
             * @type {JQuery}
             * @private
             */
            _container;
            /**
             * @type {number}
             * @private
             */
            _amountOfPoints;
            /**
             * @type {Array<number>}
             * @private
             */
            _coords;
            /**
             * @type {boolean}
             * @private
             */
            _applyValueMode = false;


            $postLink() {
                this._track = $element.find('.range-slider__track');
                this._trackColor = $element.find('.range-slider__track_colorize');
                this._handle = $element.find('.range-slider__handle');
                this._container = $element.find('.range-slider');
                this.observe(['min', 'max', 'scaleInterval', 'intervals'], this._onChangeParams);
                this.observe('ngModel', this._onChangeModel);
                this._onChangeParams();
                this._initEvents();
            }

            /**
             * @private
             */
            _onChangeModel() {
                if (this._applyValueMode) {
                    return null;
                }
                this._drawModelState();
            }

            /**
             * @private
             */
            _drawModelState() {
                const newPos = this._coords[this._numberValues[this.ngModel]];
                utils.animate(this._handle, {
                    left: newPos
                }, { duration: 100 });
                utils.animate(this._trackColor, {
                    width: newPos
                }, { duration: 100 });
            }

            /**
             * @private
             */
            _onChangeParams() {
                if (this.max == null) {
                    $element.hide();
                    return null;
                } else {
                    $element.show();
                }

                const min = this.min || 0;
                const max = this.max;
                const scaleInterval = this.scaleInterval || 1;

                this._amount = (max - min) / scaleInterval;
                this.gridValues = range(min, max + 1)
                    .map(num => num * scaleInterval);
                this._calcPosition(max, min, scaleInterval);
            }

            /**
             * @param {number} max
             * @param {number} min
             * @param {number} scaleInterval
             */
            _calcPosition(max, min, scaleInterval) {
                const intervals = this.intervals || 1;
                const sliderLength = this._track.width() - this._handle.outerWidth();
                this._amountOfPoints = this._amount * intervals;
                const oneInterval = scaleInterval / intervals;

                this._numberValues = range(min, this._amountOfPoints + 1)
                    .map(num => (Math.round((num * oneInterval) * 100) / 100));

                this._scale = sliderLength / this._amountOfPoints;

                this._coords = range(0, this._amountOfPoints + 1)
                    .map(num => this._track.position().left + num * this._scale);

                this._handle.css({
                    left: head(this._coords)
                });
            }

            /**
             * @private
             */
            _resizePosition() {
                const sliderLength = this._track.width() - this._handle.outerWidth();
                this._scale = sliderLength / this._amountOfPoints;
                this._coords = range(0, this._amountOfPoints + 1)
                    .map(num => this._track.position().left + num * this._scale);
                this._drawModelState();
            }

            /**
             * @private
             */
            _initEvents() {
                const onDragStart = () => {
                    const startPos = this._track.offset().left;
                    this._container.addClass('range-slider_drag');

                    const onDrag = utils.debounceRequestAnimationFrame(event => {
                        const utilEvent = utils.getEventInfo(event);
                        const position = Math.round(utilEvent.pageX - startPos - (this._handle.width() / 2));
                        const newPosition = Math.min(Math.max(head(this._coords), position), last(this._coords));


                        this._updateModel(this._numberValues[this._findClosestIndex(newPosition)]);

                        this._handle.css({
                            left: newPosition
                        });
                        this._trackColor.css({
                            width: newPosition
                        });
                        $scope.$apply();
                    });

                    const afterDrag = pos => {
                        this._updateModel(this._numberValues[this._findClosestIndex(pos)]);
                        this._drawModelState();
                    };

                    const onDragEnd = utils.debounceRequestAnimationFrame(event => {
                        const utilEvent = utils.getEventInfo(event);
                        this._container.removeClass('range-slider_drag');
                        $document.off('mousemove touchmove', onDrag);
                        $document.off('mouseup touchend', onDragEnd);
                        afterDrag(utilEvent.pageX - startPos - (this._handle.width() / 2));
                        $scope.$apply();
                    });

                    $document.on('mousemove touchmove', onDrag);
                    $document.on('mouseup touchend', onDragEnd);
                };

                const onResize = utils.debounceRequestAnimationFrame(() => this._resizePosition());

                this.listenEventEmitter($element, 'mousedown touchstart', onDragStart);
                this.listenEventEmitter($(window), 'resize', onResize);
            }

            /**
             * @param {number} position
             * @return number
             */
            _findClosestIndex(position) {
                position = Math.min(Math.max(position, head(this._coords)), last(this._coords));
                return this._coords.findIndex(section => Math.abs(position - section) <= (this._scale / 2));
            }

            /**
             * @param private
             * @param {number} position
             */
            _updateModel(value) {
                this._applyValueMode = true;
                this.ngModel = this._numberValues[value];
                this._applyValueMode = false;
            }

        }

        return new RangeSlider();
    };

    controller.$inject = ['$element', '$scope', 'Base', 'utils', '$document'];

    angular.module('app.ui').component('wRangeSlider', {
        bindings: {
            min: '<',
            max: '<',
            scaleInterval: '<',
            intervals: '<',
            ngModel: '='
        },
        templateUrl: 'modules/ui/directives/rangeSlider/rangeSlider.html',
        controller
    });
})();

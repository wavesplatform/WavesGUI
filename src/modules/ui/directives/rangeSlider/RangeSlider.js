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
            step;
            /**
             * @type {number}
             */
            precision;
            /**
             * @type {number}
             */
            ngModel;
            /**
             * @type {Array<number>}
             */
            numberValues;
            /**
             * @type {number}
             * @private
             */
            _amount;
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
             * @type {Array<number>}
             * @private
             */
            _sections;


            $postLink() {
                this._track = $element.find('.range-slider__track');
                this._handle = $element.find('.range-slider__handle');
                this._container = $element.find('.range-slider');
                // this._arrangementOfNumber();
                this.observe(['min', 'max', 'step', 'precision'], this._onChangeParams);
                this._onChangeParams();
                this._initEvents();
            }

            _onChangeParams() {
                if (this.max == null) {
                    $element.hide();
                    return null;
                } else {
                    $element.show();
                }

                const min = this.min || 0;
                const max = this.max;
                const step = this.step || 1;
                // const precision = this.precision || 0;

                this._amount = (max - min) / step;
                const startValue = (min / step);
                this.numberValues = range(startValue, this._amount + 1)
                    .map(num => num * step);
                this._scale = (this._track.width() - this._handle.outerWidth()) / this._amount;

                this._calcPosition();
            }

            _calcPosition() {
                this._sections = range(0, this._amount + 1)
                    .map(num => Math.round(this._track.position().left + num * this._scale));
                this._handle.css({
                    left: this._sections[0]
                });
            }

            _initEvents() {
                const onDragStart = ev => {
                    this._container.addClass('range-slider_drag');
                    const startPos = ev.pageX;
                    const onDrag = utils.debounceRequestAnimationFrame(event => {
                        const position = Math.round(event.pageX - this._track.offset().left);
                        // console.log('%c pos', 'background: #222; color: #bada55', position);
                        const newPosition = Math.min(Math.max(head(this._sections), position), last(this._sections));

                        this.ngModel = this.numberValues[this._findClosestIndex(newPosition)];
                        this._handle.css({
                            left: newPosition
                        });
                        $scope.$apply();
                    });

                    const onDragEnd = pos => {
                        const newPos = this._sections[this._findClosestIndex(pos)];
                        utils.animate(this._handle, {
                            left: newPos
                        }, { duration: 100 });
                    };

                    $document.on('mousemove', onDrag);
                    $document.on('mouseup', utils.debounceRequestAnimationFrame(event => {
                        this._container.removeClass('range-slider_drag');
                        $document.off('mousemove mouseup');
                        onDragEnd(event.pageX - startPos);
                        $scope.$apply();
                    }));
                };

                this.listenEventEmitter(this._handle, 'mousedown', onDragStart);
            }

            /*
             * @param {number} pos
             */
            _findClosestIndex(pos) {
                return this._sections.findIndex(section => Math.abs(pos - section) <= (this._scale / 2));
            }

        }

        return new RangeSlider();
    };

    controller.$inject = ['$element', '$scope', 'Base', 'utils', '$document'];

    angular.module('app.ui').component('wRangeSlider', {
        bindings: {
            min: '<',
            max: '<',
            step: '<',
            precision: '<',
            ngModel: '='
        },
        templateUrl: 'modules/ui/directives/rangeSlider/rangeSlider.html',
        controller
    });
})();

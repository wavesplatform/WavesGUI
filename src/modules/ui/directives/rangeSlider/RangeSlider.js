(function () {
    'use strict';

    /**
     * @param {JQuery} $element
     * @param {$rootScope.Scope} $scope
     * @param {typeof Base} Base
     * @param {app.utils} utils
     * @return {RangeSlider}
     */
    const controller = function ($element, $document, $scope, Base) {

        const { subtract, divide, range, slice, add } = require('ramda');

        class RangeSlider extends Base {

            /**
             * @type {number}
             */
            min = null;

            constructor() {
                super();
                this.max = null;
                this.step = null;
                this.title = '';
                this.amount = null;
                this.length = null;
                this.scale = null;
                this.numbers = [];
                this.track = {};
                this.handle = {};
                this.sections = [];
            }

            $postLink() {
                this._init();
                // this._arrangementOfNumber();
            }

            _init() {
                this.track = $element.find('.range-slider__track');
                this.handle = $element.find('.range-slider__handler');
                this.length = subtract(this.max, this.min);
                this.amount = divide(this.length, this.step);
                this.numbers = range(0, this.amount);
                this.scale = divide(this.track.width(), this.amount);
                this.sections = this.numbers.map(num => num * this.scale);
                this._handlerPosition();
                this._initEvents();
            }

            _handlerPosition() {
                const trackLeft = this.track.position().left;
                const trackMargin = slice(0, -2, this.track.css('margin-left'));
                const halfWidth = divide(this.handle.width(), 2);
                const sub = subtract(trackLeft, halfWidth);
                this.handle.css({
                    left: add(trackMargin, sub)
                });
            }

            _initEvents() {
                const drag = event => {
                    this.handle.css({
                        left: event.pageX - this.track.offset().left
                    });
                };

                const setDragState = () => {
                    $document.on('mousemove', drag);
                };

                this.handle.on('mousedown', setDragState);
                $document.on('mouseup', () => $document.off());
            }


        }

        return new RangeSlider();
    };

    controller.$inject = ['$element', '$document', '$scope', 'Base', 'utils'];

    angular.module('app.ui').component('wRangeSlider', {
        bindings: {
            min: '<',
            max: '<',
            step: '<',
            value: '='
        },
        templateUrl: 'modules/ui/directives/rangeSlider/rangeSlider.html',
        controller
    });
})();

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

        const { range, last } = require('ramda');

        class RangeSlider extends Base {

            /**
             * @type {number}
             */
            min = 0;

            /**
             * @type {number}
             */
            max = 100;

            /**
             * @type {number}
             */
            step = 100;

            /**
             * @type {number}
             */
            value = 0;

            constructor() {
                super();
                this.title = '';
                this.amount = null;
                this.scale = null;
                this.numbers = [];
                this.numberValues = [];
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
                this.handle = $element.find('.range-slider__handle');
                this.container = $element.find('.range-slider');

                this.amount = (this.max - this.min) / this.step;
                const startValue = (this.min / this.step);
                this.numberValues = range(startValue, this.amount + 2)
                    .map(num => num * this.step);
                this.scale = (this.track.width() - this.handle.outerWidth()) / this.amount;

                this._calcPosition();
                this._initEvents();
            }

            _calcPosition() {
                this.sections = range(0, this.amount + 1)
                    .map(num => Math.round(this.track.position().left + num * this.scale));
                this.handle.css({
                    left: this.sections[0]
                });
            }

            _initEvents() {
                let startPos = null;
                const setDragState = ev => {
                    this.container.addClass('range-slider_drag');
                    startPos = startPos ? startPos : ev.pageX;
                    const drag = event => {
                        const position = Math.round(event.pageX - startPos + (this.handle.width() / 2));
                        let newPosition;
                        if (position < this.sections[0]) {
                            newPosition = this.sections[0];
                        } else if (position > last(this.sections)) {
                            newPosition = last(this.sections);
                        } else {
                            newPosition = position;
                        }
                        this.value = this.numberValues[this._findClosestIndex(newPosition)];
                        this.handle.css({
                            left: newPosition
                        });
                        $scope.$apply();
                    };

                    const afterDrag = async pos => {
                        const newPos = this.sections[this._findClosestIndex(pos)];
                        await utils.animate(this.handle, {
                            left: newPos
                        }, { duration: 100 });
                    };

                    $document.on('mousemove', drag);
                    $document.on('mouseup', async () => {
                        this.container.removeClass('range-slider_drag');
                        $document.off('mousemove mouseup');
                        await afterDrag(event.pageX - startPos);
                    });
                };

                this.handle.on('mousedown', setDragState);
            }

            /*
             * @param {number} pos
             */
            _findClosestIndex(pos) {
                return this.sections.findIndex(section => Math.abs(pos - section) <= (this.scale / 2));
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
            value: '<'
        },
        templateUrl: 'modules/ui/directives/rangeSlider/rangeSlider.html',
        controller
    });
})();

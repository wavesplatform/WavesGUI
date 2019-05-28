(function () {
    'use strict';

    /**
     * @param Base
     * @param {jQuery} $element
     * @param $timeout
     * @param carouselManager
     * @param {app.utils} utils
     * @return {RoadMap}
     */
    const controller = function ($element, $timeout, carouselManager, utils, Base) {

        const { range, last } = require('ramda');

        class RoadMap extends Base {

            /**
             * @type {number}
             */
            length = null;
            /**
             * @type {string}
             * @private
             */
            id = null;
            /**
             * @type {number}
             * @private
             */
            interval = null;
            /**
             * @type {number}
             * @private
             */
            startFrom = null;
            /**
             * @private
             */
            timer = null;
            /**
             * @private
             * @type {jQuery}
             */
            tempWrapper = null;
            /**
             * @private
             * @type {jQuery}
             */
            content = null;
            /**
             * @private
             * @type {Array}
             */
            _coords = null;

            $postLink() {
                // carouselManager.registerSlider(this.id, this);
                this.interval = Number(this.interval) || 0;
                this.tempWrapper = $element.find('.slide-window:first');
                this.wrapper = $element.find('.slider-content:first');
                this.content = $element.find('.slider-content:first').children();


                this._remapSlides();
                const onResize = utils.debounceRequestAnimationFrame(() => this._remapSlides());
                this.listenEventEmitter($(window), 'resize', onResize);

                $element.hover(() => {
                    this.stopInterval();
                }, () => {
                    this.initializeInterval();
                });
                this.initializeInterval();
            }

            $onDestroy() {
                // carouselManager.removeSlider(this.id);
            }

            initializeInterval() {
                if (this.interval) {
                    if (this.timer) {
                        this.stopInterval();
                    }
                    this.timer = $timeout(() => this._step(), this.interval);
                }
            }

            stopInterval() {
                if (this.interval && this.timer) {
                    $timeout.cancel(this.timer);
                    this.timer = null;
                }
            }

            /**
             * @private
             */
            _remapSlides() {
                this.slidesAmount = this._getSlidesInWindowAmount(window.innerWidth);
                const divs = range(0, this.slidesAmount).map(() => '<div class="slide"></div>');
                this.tempWrapper.append(divs);
                const slide = this.tempWrapper.find('.slide');
                const width = slide.outerWidth();
                const startCoords = slide
                    .toArray()
                    .map(element => Math.round($(element).offset().left));
                this.tempWrapper.empty();
                this.diff = startCoords.length > 1 ? startCoords[1] - startCoords[0] : width + 10;
                this._coords = this.content.toArray().map((element, i) => {
                    const X = (i - 1) * this.diff;
                    $(element)
                        .css({ transform: `translateX(${X}px)`, width })
                        .data('translate', X);

                    return X;
                });

                this.content.addClass('absolute');
            }

            /**
             * @private
             */
            _getSlidesInWindowAmount(width) {
                switch (true) {
                    case (width < 620):
                        return 1;
                    case (width < 1000):
                        return 2;
                    case (width < 1440):
                        return 3;
                    default:
                        return 4;
                }
            }

            /**
             * @param {number} active
             * @param {number} old
             * @return Promise
             * @private
             */
            _move() {
                const lastPos = last(this._coords);
                return Promise.all(this.content.toArray().map(element => {
                    const $element = $(element);
                    const start = $element.data('translate');
                    const duration = 1000;
                    const newPos = start - this.diff;
                    $element.prop('progress', 0);
                    $element.data('translate', newPos);
                    let opacity;
                    switch (true) {
                        case (newPos < -this.diff || newPos > this._coords[this.slidesAmount + 1]):
                            opacity = 0;
                            break;
                        case (newPos < 0 || newPos > this._coords[this.slidesAmount]):
                            opacity = 0.2;
                            break;
                        default:
                            opacity = 1;
                            break;
                    }
                    return utils.animate($element, {
                        opacity,
                        progress: 1
                    }, {
                        duration: duration,
                        step: progress => {
                            const translate = start + ((newPos - start) * progress);
                            $element.css('transform', `translateX(${translate}px)`);
                        },
                        complete: () => {
                            if (newPos < -this.diff) {
                                $element.css('transform', `translateX(${lastPos}px)`);
                                $element.data('translate', lastPos);
                            }
                        }
                    });
                }));
            }

            /**
             * @private
             */
            _step() {
                this.stopInterval();
                this._move().then(() => {
                    this.initializeInterval();
                });
            }

        }

        return new RoadMap();
    };

    controller.$inject = ['$element', '$timeout', 'carouselManager', 'utils', 'Base'];

    angular.module('app.ui').component('wRoadMap', {
        transclude: true,
        bindings: {
            id: '@',
            interval: '@',
            startFrom: '@'
        },
        controller: controller,
        templateUrl: 'modules/ui/directives/carousel/carousel.html'
    });
})();

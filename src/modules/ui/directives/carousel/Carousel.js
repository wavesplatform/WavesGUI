(function () {
    'use strict';

    /**
     * @param {jQuery} $element
     * @param $timeout
     * @param {CarouselManager} carouselManager
     * @return {Carousel}
     */
    const controller = function ($element, $timeout, carouselManager, utils, Base) {

        const { range } = require('ramda');

        class Carousel extends Base {

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
            node = null;
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
                carouselManager.registerSlider(this.id, this);
                const start = Number(this.startFrom);
                this.interval = Number(this.interval) || 0;
                this.node = $element.find('.slide-window:first');
                this.wrapper = $element.find('.slider-content:first');
                this.content = $element.find('.slider-content:first')
                    .children();
                this.length = this.content.length;

                if (start && start > 0 && start < this.length) {
                    this.active = start;
                } else {
                    this.active = 0;
                }

                this._calcCoords();
                const onResize = utils.debounceRequestAnimationFrame(() => this._calcCoords());
                this.listenEventEmitter($(window), 'resize', onResize);
                $element.hover(() => {
                    this.stopInterval();
                }, () => {
                    this.initializeInterval();
                });

                this.initializeInterval();
            }

            $onDestroy() {
                carouselManager.removeSlider(this.id);
            }

            getActive() {
                return this.active;
            }

            /**
             * @param {number} index
             */
            goTo(index) {
                if (index >= 0 && index < this.length && index !== this.active) {
                    const old = this.active;
                    this.active = index;
                    this.stopInterval();
                    this._move(this.active, old).then(() => {
                        this.initializeInterval();
                    });
                }
            }

            next() {
                this.goTo(this.active + 1);
            }

            prev() {
                this.goTo(this.active - 1);
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
            _calcCoords() {
                let slidesAmount = 4;
                switch (true) {
                    case (window.innerWidth < 620):
                        slidesAmount = 1;
                        break;
                    case (window.innerWidth < 1000):
                        slidesAmount = 2;
                        break;
                    case (window.innerWidth < 1400):
                        slidesAmount = 3;
                        break;
                    default:
                        slidesAmount = 4;
                }
                const divs = range(0, slidesAmount).map(() => '<div class="slide"></div>');
                this.node.append(divs);
                const width = this.node.find('.slide').outerWidth();
                const startCoords = this.node.find('.slide').toArray().map(element => {
                    return $(element).offset().left;
                });
                this.node.empty();
                this.diff = Math.round(startCoords[1] - startCoords[0]);
                this._coords = this.content.toArray().map((element, i) => {
                    const X = (i - 1) * this.diff;
                    $(element).css('transform', `translateX(${X}px)`);
                    $(element).css('width', width);
                    $(element).data('translate', X);
                    return X;
                });

                this.content.addClass('abs');
            }

            /**
             * @param {number} active
             * @param {number} old
             * @return Promise
             * @private
             */
            _move() {
                const lastPos = this._coords[this._coords.length - 1];

                return Promise.all(this.content.toArray().map(element => {
                    const $element = $(element);
                    const start = $element.data('translate');
                    const duration = 1000;
                    const newPos = start - this.diff;
                    $element.prop('progress', 0);
                    $element.data('translate', newPos);
                    return utils.animate($element, {
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
                if (this.active === this.length - 1) {
                    this.goTo(0);
                } else {
                    this.next();
                }
            }

            /**
             * @private
             */
            // _getLeft() {
            //     return { left: `${100 * this.active}%` };
            // }

        }

        return new Carousel();
    };

    controller.$inject = ['$element', '$timeout', 'carouselManager', 'utils', 'Base'];

    angular.module('app.ui').component('wCarousel', {
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

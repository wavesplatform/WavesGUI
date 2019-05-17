(function () {
    'use strict';

    /**
     * @param {jQuery} $element
     * @param $timeout
     * @param {CarouselManager} carouselManager
     * @return {Carousel}
     */
    const controller = function ($element, $timeout, carouselManager, utils) {

        class Carousel {

            constructor() {
                /**
                 * @type {number}
                 */
                this.length = null;
                /**
                 * @type {string}
                 * @private
                 */
                this.id = null;
                /**
                 * @type {number}
                 * @private
                 */
                this.interval = null;
                /**
                 * @type {number}
                 * @private
                 */
                this.startFrom = null;
                /**
                 * @private
                 */
                this.timer = null;
                /**
                 * @private
                 * @type {jQuery}
                 */
                this.node = null;
                /**
                 * @private
                 * @type {jQuery}
                 */
                this.content = null;
                /**
                 * @private
                 * @type {Array}
                 */
                this._coords = null;
            }

            $postLink() {
                carouselManager.registerSlider(this.id, this);
                const start = Number(this.startFrom);
                this.interval = Number(this.interval) || 0;
                // this.node = $element.find('.slide-window:first');
                this.node = $element.find('.slider-content:first');
                this.content = $element.find('.slider-content:first')
                    .children();
                this.length = this.content.length;

                if (start && start > 0 && start < this.length) {
                    this.active = start;
                } else {
                    this.active = 0;
                }

                this._coords = this.content.toArray().map(element => {
                    const X = $(element).offset().left - 225;
                    $(element).css('transform', `translateX(${X}px)`);
                    return X;
                });

                this.content.addClass('abs');
                $element.hover(() => {
                    this.stopInterval();
                }, () => {
                    this.initializeInterval();
                });

                this.initializeInterval();

                this.content.eq(this.active).appendTo(this.node);
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
             * @param {number} active
             * @param {number} old
             * @return Promise
             * @private
             */
            // _move(active, old) {
            //     const direction = active > old;
            //     console.log('%c direction', 'color: #e5b6ed', direction);
            //     const $active = this.content.eq(active);
            //     const $old = this.content.eq(old);
            //
            //     let collection;
            //     let targetLeft;
            //
            //     if (direction) {
            //         $active.css('left', '100%');
            //         $old.css('left', '0');
            //         this.node.append($active);
            //         collection = $old.add($active);
            //         targetLeft = '-=100%';
            //     } else {
            //         $old.css('left', '0');
            //         this.node.prepend($active);
            //         $active.css('left', '-100%');
            //         collection = $active.add($old);
            //         targetLeft = '+=100%';
            //     }
            //
            //     return new Promise((resolve) => {
            //         collection.stop()
            //             .animate({ left: targetLeft }, () => {
            //                 // $old.remove();
            //                 $active.css('left', '');
            //                 resolve();
            //             });
            //     });
            // }
            /**
             * @param {number} active
             * @param {number} old
             * @return Promise
             * @private
             */
            _move() {
                const lastPos = this._coords[this._coords.length - 1];
                // const direction = active > old;
                // const $active = this.content.eq(active);
                // const $old = this.content.eq(old);

                //
                // return new Promise((resolve) => {
                //     this.node.stop()
                //         .animate({ left: '-=375px' }, () => {
                //             // $old.remove();
                //             this.node.prepend($active);
                //             this.node.css('left', 0);
                //             resolve();
                //         });
                // });


                return Promise.all(this.content.toArray().map(element => {
                    const $element = $(element);
                    const start = $(element).offset().left;
                    const duration = 1000;
                    const newPos = start - 375;
                    $element.prop('progress', 0);
                    return utils.animate($(element), {
                        progress: 1
                    }, {
                        duration: duration,
                        step: progress => {
                            const translate = start + ((newPos - start) * progress);
                            $element.css('transform', `translateX(${translate}px)`);
                        },
                        complete: () => {
                            if (newPos < -225) {
                                $element.css('transform', `translateX(${lastPos}px)`);
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

    controller.$inject = ['$element', '$timeout', 'carouselManager', 'utils'];

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

(function () {
    'use strict';

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {jQuery} $element
     * @param $timeout
     * @param carouselManager
     * @param ChartFactory
     * @param {app.utils} utils
     * @return {Carousel}
     */
    const controller = function ($element, $timeout, carouselManager, utils, Base, $scope, ChartFactory) {

        const { last } = require('ramda');

        const chartOptions = {
            red: {
                axisX: 'timestamp',
                axisY: 'rate',
                lineColor: '#ef4829',
                fillColor: '#FFF',
                gradientColor: ['#FEEFEC', '#FFF'],
                lineWidth: 4
            },
            blue: {
                axisX: 'timestamp',
                axisY: 'rate',
                lineColor: '#1f5af6',
                fillColor: '#FFF',
                gradientColor: ['#EAF0FE', '#FFF'],
                lineWidth: 4
            }
        };

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
             * @private
             */
            timer = null;
            /**
             * @private
             * @type {number}
             */
            _diff = null;
            /**
             * @private
             * @type {jQuery}
             */
            $slides = null;
            /**
             * @private
             * @type {Array}
             */
            _coords = null;

            $postLink() {
                this.observeOnce('pairsInfoList', () => {
                    utils.postDigest($scope).then(() => {
                        carouselManager.registerSlider(this.id, this);
                        this.interval = Number(this.interval) || 0;
                        this.$slidesContainer = $element.find('.slider-content:first');
                        this.$slides = $element.find('.slider-content:first').children();
                        this._mapSlides = this.$slides.toArray().map(slide => ({ $slide: $(slide), translateX: null }));

                        this._fillGraphs();
                        this._remapSlides();

                        const onResize = utils.debounceRequestAnimationFrame(() => {
                            this._remapSlides();
                            this.initializeInterval();
                        });
                        this.listenEventEmitter($(window), 'resize', onResize);

                        $element.hover(() => {
                            this.stopInterval();
                        }, () => {
                            this.initializeInterval();
                        });

                        this.initializeInterval();
                    });
                });

            }

            $onDestroy() {
                carouselManager.removeSlider(this.id);
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
             * @public
             */
            goToDexDemo(pairAssets) {
                utils.openDex(pairAssets.assetId1, pairAssets.assetId2, 'dex-demo');
            }

            /**
             * @private
             */
            _fillGraphs() {
                this._mapSlides.forEach(({ $slide }, i) => {
                    const info = this.pairsInfoList[i];
                    const options = info.change24.gt(0) ? chartOptions.blue : chartOptions.red;
                    new ChartFactory(
                        $slide.find('.graph'),
                        options,
                        this.pairsInfoList[i].rateHistory
                    );
                });
            }

            /**
             * @private
             */
            _remapSlides() {
                this._stopSlides();
                this.slidesAmount = Carousel._getSlidesInWindowAmount(window.innerWidth);

                const { width, startCoords } = this._getWidthAndStart();
                this._diff = startCoords.length > 1 ? startCoords[1] - startCoords[0] : width + 10;
                this._coords = this.$slides.toArray().map((element, i) => (i - 1) * this._diff);

                this._mapSlides.forEach((slide, i) => {
                    slide.translateX = this._coords[i];
                    slide.$slide.css({ transform: `translateX(${this._coords[i]}px)` });
                });

                this.$slides.addClass('absolute');
            }

            /**
             * @private
             */
            _getWidthAndStart() {
                const tempSlidesContainer = this.$slidesContainer.clone();
                tempSlidesContainer.find('.slide').slice(this.slidesAmount).remove();
                const slides = tempSlidesContainer.find('.slide');
                slides
                    .removeAttr('style')
                    .removeClass('absolute');
                tempSlidesContainer.appendTo($element.find('.slider'));

                const width = slides.outerWidth();
                const startCoords = slides
                    .toArray()
                    .map(slide => Math.round($(slide).offset().left));

                tempSlidesContainer.remove();
                return { width, startCoords };
            }

            /**
             * @private
             */
            static _getSlidesInWindowAmount(width) {
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
             * @return Promise
             * @private
             */
            _move() {
                const lastPos = last(this._coords);
                return Promise.all(this._mapSlides.map(slide => {
                    const $slide = slide.$slide;
                    const start = slide.translateX;
                    const duration = 1000;
                    const end = start - this._diff;
                    slide.translateX = end;
                    const opacity = this._switchOpacity(end);

                    return utils.animate($slide, {
                        opacity,
                        progress: 1
                    }, {
                        duration: duration,
                        progress: this._animateProgress(start, end, $slide),
                        complete: () => {
                            if (end < -this._diff) {
                                $slide.css('transform', `translateX(${lastPos}px)`);
                                slide.translateX = lastPos;
                            }
                        }
                    });
                }));
            }

            /**
             * @private
             */
            _animateProgress(start, end, slide) {
                return (animation, progress) => {
                    slide.css('transform', `translateX(${start + ((end - start) * progress)}px)`);
                };
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

            /**
             * @private
             */
            _switchOpacity(newPos) {
                switch (true) {
                    case (newPos < -this._diff || newPos > this._coords[this.slidesAmount + 1]):
                        return 0;
                    case (newPos < 0 || newPos > this._coords[this.slidesAmount]):
                        return 0.2;
                    default:
                        return 1;
                }
            }

            /**
             * @private
             */
            _stopSlides() {
                this._mapSlides.forEach(slide => {
                    slide.$slide.stop();
                });
            }

        }

        return new Carousel();
    };

    controller.$inject = ['$element', '$timeout', 'carouselManager', 'utils', 'Base', '$scope', 'ChartFactory'];

    angular.module('app.ui').component('wCarousel', {
        transclude: true,
        bindings: {
            id: '@',
            interval: '@',
            pairsInfoList: '<'
        },
        controller: controller,
        templateUrl: 'modules/ui/directives/carousel/carousel.html'
    });
})();

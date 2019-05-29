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
    const controller = function ($element, $timeout, carouselManager, utils, Base, $scope, $document) {

        const { last } = require('ramda');

        // TODO to config
        const edges = [
            {
                date: 'roadmap.nov2018.date',
                title: 'roadmap.nov2018.title',
                text: 'roadmap.nov2018.text',
                timeWhenMade: 'past'
            },
            {
                date: 'roadmap.nov2018.date',
                title: 'roadmap.nov2018.title',
                text: 'roadmap.nov2018.text',
                timeWhenMade: 'past'
            },
            {
                date: 'roadmap.nov2018.date',
                title: 'roadmap.nov2018.title',
                text: 'roadmap.nov2018.text',
                timeWhenMade: 'past'
            },
            {
                date: 'roadmap.nov2018.date',
                title: 'roadmap.nov2018.title',
                text: 'roadmap.nov2018.text',
                timeWhenMade: 'past'
            },
            {
                date: 'roadmap.nov2018.date',
                title: 'roadmap.nov2018.title',
                text: 'roadmap.nov2018.text',
                timeWhenMade: 'past'
            },
            {
                date: 'roadmap.dec2018.date',
                title: 'roadmap.dec2018.title',
                text: 'roadmap.dec2018.text',
                timeWhenMade: 'now'
            },
            {
                date: 'roadmap.dec2019.date',
                title: 'roadmap.dec2019.title',
                text: 'roadmap.dec2019.text',
                timeWhenMade: 'future'
            }
        ];

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
            temp_wrapper = null;
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

            get _wrapperTranslate() {
                return this._wrapper.data('translate');
            }

            set _wrapperTranslate(translate) {
                this._wrapper.data('translate', translate);
                this._wrapper.css('transform', `translateX(${translate}px)`);
            }

            $postLink() {
                this.edges = edges;
                // carouselManager.registerSlider(this.id, this);
                this.interval = Number(this.interval) || 0;
                this.temp_wrapper = $element.find('.slide-window:first');
                this._wrapper = $element.find('.slider-content:first');
                utils.postDigest($scope).then(() => {
                    this.content = this._wrapper.children();
                    // this._wrapper.css('height', this.content.css('height'));
                    this._remapSlides();
                    this._initEvents();
                });
                // const onResize = utils.debounceRequestAnimationFrame(() => this._remapSlides());
                // this.listenEventEmitter($(window), 'resize', onResize);

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
            _drawModelState() {
                const startAnim = this._wrapperTranslate;
                // const x1 = startAnim - this._wrapperStartPos;
                // const x2 = Math.round(x1 / this._diff) * this._diff;
                // console.log(x1);
                // console.log(x2);
                // console.log('%c start', 'color: #e5b6ed', startAnim);
                // const newPos = startAnim + x2;
                // console.log('%c newPos', 'color: #e5b6ed', newPos);
                this._wrapper.prop('progress', 0);

                const slide = this.content.toArray()
                    .find(slide => Math.abs($(slide).offset().left - this._centerSlideX) < this._diff / 2);

                const newPos = this._wrapperTranslate + (this._centerSlideX - $(slide).offset().left);

                utils.animate(this._wrapper, {
                    progress: 1
                }, {
                    duration: 300,
                    step: progress => {
                        this._wrapperTranslate = startAnim + ((newPos - startAnim) * progress);
                    }
                });
            }

            /**
             * @private
             */
            _initEvents() {
                const onDragStart = eventStart => {
                    const utilEventStart = utils.getEventInfo(eventStart);
                    const startDragX = utilEventStart.pageX;
                    this._wrapper.stop(true, false);
                    const offset = startDragX - this._wrapperTranslate;
                    this._wrapper.addClass('slider_drag'); // TODO поменять классы на нормальные
                    const onDrag = utils.debounceRequestAnimationFrame(event => {
                        const utilEvent = utils.getEventInfo(event);
                        const position = Math.round(utilEvent.pageX - offset);
                        const newPosition = Math.max(
                            Math.min(this._diff, position),
                            -(this.content.length * this._diff - this._diff * 2)
                        );

                        this._wrapperTranslate = newPosition;
                        $scope.$apply();
                    });

                    const onDragEnd = utils.debounceRequestAnimationFrame(() => {
                        // const utilEvent = utils.getEventInfo(event);
                        // this._container.removeClass('range-slider_drag');
                        $document.off('mousemove touchmove', onDrag);
                        $document.off('mouseup touchend', onDragEnd);
                        // afterDrag(utilEvent.pageX - startPos - (this._handle.width() / 2));
                        this._drawModelState();
                        $scope.$apply();
                    });

                    $document.on('mousemove touchmove', onDrag);
                    $document.on('mouseup touchend', onDragEnd);
                };

                // const onResize = utils.debounceRequestAnimationFrame(() => this._resizePosition());
                this.listenEventEmitter($element, 'mousedown touchstart', onDragStart);
                // this.listenEventEmitter($(window), 'resize', onResize);
            }

            /**
             * @private
             */
            _remapSlides() {
                this._diff = this.content.eq(1).offset().left - this.content.eq(0).offset().left;
                const nowLeft = $element.find('.now').offset().left;
                this._centerSlideX = $document.width() / 2 - (this.content.eq(0).outerWidth() / 2);
                const offset = Math.round(nowLeft - this._centerSlideX);
                this._wrapper.css('transform', `translateX(${-offset}px)`);
                this._wrapperTranslate = -offset;
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
                    const newPos = start - this._diff;
                    $element.prop('progress', 0);
                    $element.data('translate', newPos);
                    let opacity;
                    switch (true) {
                        case (newPos < -this._diff || newPos > this._coords[this.slidesAmount + 1]):
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
                            if (newPos < -this._diff) {
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

    controller.$inject = ['$element', '$timeout', 'carouselManager', 'utils', 'Base', '$scope', '$document'];

    angular.module('app.ui').component('wRoadMap', {
        bindings: {
            id: '@',
            interval: '@',
            startFrom: '@'
        },
        controller: controller,
        templateUrl: 'modules/ui/directives/roadMap/roadMap.html'
    });
})();

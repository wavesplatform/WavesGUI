(function () {
    'use strict';

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {jQuery} $element
     * @param $timeout
     * @param carouselManager
     * @param {app.utils} utils
     * @param {JQuery} $document
     * @return {RoadMap}
     */
    const controller = function ($element, $timeout, carouselManager, utils, Base, $scope, $document) {

        // TODO to config
        const edges = [
            {
                date: 'roadmap.feb2017.date',
                title: 'roadmap.feb2017.title',
                text: 'roadmap.feb2017.text',
                timeWhenMade: 'past'
            },
            {
                date: 'roadmap.feb2018.date',
                title: 'roadmap.feb2018.title',
                text: 'roadmap.feb2018.text',
                timeWhenMade: 'past'
            },
            {
                date: 'roadmap.may2018.date',
                title: 'roadmap.may2018.title',
                text: 'roadmap.may2018.text',
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

        const bounce = 32;

        class RoadMap extends Base {

            /**
             * @type {number}
             */
            length;
            /**
             * @private
             * @type {jQuery}
             */
            _wrapper;
            /**
             * @private
             * @type {jQuery}
             */
            _content;
            /**
             * @private
             * @type {number}
             */
            _diff;
            /**
             * @private
             * @type {number}
             */
            _centerSlideX;
            /**
             * @private
             * @type {number}
             */
            _leftEdge;
            /**
             * @private
             * @type {number}
             */
            _rightEdge;


            get _wrapperTranslate() {
                return this._wrapper.data('translate');
            }

            set _wrapperTranslate(translate) {
                this._wrapper.data('translate', translate);
                this._wrapper.css('transform', `translateX(${translate}px)`);
            }

            $postLink() {
                this.edges = edges;
                this._wrapper = $element.find('.roadmap-content');
                utils.postDigest($scope).then(() => {
                    this._content = this._wrapper.children();
                    this._remapSlides();
                    this._initEvents();
                });
            }


            /**
             * @private
             */
            _drawModelState() {
                const startAnim = this._wrapperTranslate;

                const centerSlide = this._content.toArray()
                    .find(slide => Math.abs($(slide).offset().left - this._centerSlideX) <= this._diff / 2);

                const newPos = this._wrapperTranslate + (this._centerSlideX - $(centerSlide).offset().left);

                utils.animate(this._wrapper, {
                    progress: 1
                }, {
                    duration: 200,
                    progress: (animation, progress) => {
                        this._wrapperTranslate = startAnim + ((newPos - startAnim) * progress);
                    }
                });

            }

            /**
             * @private
             */
            _initEvents() {
                const onDragStart = eventStart => {
                    this._wrapper.stop(true, false);

                    const utilEventStart = utils.getEventInfo(eventStart);
                    const startDragX = utilEventStart.pageX;
                    const offset = startDragX - this._wrapperTranslate;

                    this._wrapper.addClass('roadmap_drag');

                    const onDrag = utils.debounceRequestAnimationFrame(event => {
                        const utilEvent = utils.getEventInfo(event);
                        const position = Math.round(utilEvent.pageX - offset);

                        this._wrapperTranslate = Math.max(
                            Math.min(this._leftEdge, position),
                            this._rightEdge
                        );

                        $scope.$apply();
                    });

                    const onDragEnd = utils.debounceRequestAnimationFrame(() => {
                        $document.off('mousemove touchmove', onDrag);
                        $document.off('mouseup touchend', onDragEnd);
                        this._drawModelState();
                        $scope.$apply();
                    });

                    $document.on('mousemove touchmove', onDrag);
                    $document.on('mouseup touchend', onDragEnd);
                };

                const onResize = utils.debounceRequestAnimationFrame(() => this._remapSlides());

                this.listenEventEmitter($element, 'mousedown touchstart', onDragStart);
                this.listenEventEmitter($(window), 'resize', onResize);
            }

            /**
             * @private
             */
            _remapSlides() {
                const slide = index => this._content.eq(index);
                const offsetLeft = slide => slide.offset().left;

                this._diff = offsetLeft(slide(1)) - offsetLeft(slide(0));
                this._centerSlideX = $document.width() / 2 - (slide(0).outerWidth() / 2);

                const nowLeft = offsetLeft($element.find('.now'));
                const offset = Math.round(nowLeft - this._centerSlideX);

                this._wrapper.css('transform', `translateX(${-offset}px)`);

                this._leftEdge = offsetLeft($element.find('.now')) - offsetLeft($element.find('.roadmap')) + bounce;
                this._rightEdge = -((this._content.length - 1) * this._diff) + this._leftEdge - bounce * 2;

                this._wrapperTranslate = -offset;
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

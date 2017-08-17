(function () {
    'use strict';

    class Slider {

        /**
         *
         * @param $scope
         * @param $element
         * @param $timeout
         * @param {SliderManager} sliderManager
         */
        constructor($scope, $element, $timeout, sliderManager) {
            /**
             * @type {number}
             */
            this.length = null;
            /**
             * @private
             */
            this.$timeout = $timeout;
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

            const destroy = $scope.$on('$destroy', () => {
                sliderManager.removeSlider(this.id);
                destroy();
            });

            $element.hover(() => {
                this._stopInterval();
            }, () => {
                this._initializeInterval();
            });

            /**
             * @private
             */
            this.$postLink = function () {
                sliderManager.registerSlider(this.id, this);
                const start = Number(this.startFrom);
                this.interval = Number(this.interval) || 0;
                this.node = $element.find('.slide-window:first');
                this.content = $element.find('.slider-content:first')
                    .children();
                this.length = this.content.length;

                if (start && start > 0 && start < this.length) {
                    this.active = start;
                } else {
                    this.active = 0;
                }

                this._initializeInterval();

                this.content.eq(this.active).appendTo(this.node);
            };
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
                this._move(this.active, old);
            }
        }

        next() {
            this.goTo(this.active + 1);
        }

        prev() {
            this.goTo(this.active - 1);
        }

        /**
         * @private
         */
        _initializeInterval() {
            if (this.interval) {
                this.timer = this.$timeout(() => this._step(), this.interval);
            }
        }

        /**
         * @private
         */
        _resetInterval() {
            this._stopInterval();
            this._initializeInterval();
        }

        /**
         * @private
         */
        _stopInterval() {
            if (this.interval && this.timer) {
                this.$timeout.cancel(this.timer);
                this.timer = null;
            }
        }

        /**
         * @param {number} active
         * @param {number} old
         * @private
         */
        _move(active, old) {
            this._resetInterval();
            const direction = active > old;
            const $active = this.content.eq(active);
            const $old = this.content.eq(old);

            if (direction) {
                $active.css('left', '100%');
                $old.css('left', '0');
                this.node.append($active);
                $old.add($active)
                    .stop()
                    .animate({ left: '-=100%' }, () => {
                        $old.remove();
                        $active.css('left', '');
                    });
            } else {
                $old.css('left', '0');
                this.node.prepend($active);
                $active.css('left', '-100%');
                $active.add($old)
                    .stop()
                    .animate({ left: '+=100%' }, () => {
                        $old.remove();
                        $active.css('left', '');
                    });
            }
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
            this.timer = this.$timeout(() => this._step(), this.interval);
        }

        /**
         * @private
         */
        _getLeft() {
            return { left: `${100 * this.active}%` };
        }

    }

    Slider.$inject = ['$scope', '$element', '$timeout', 'SliderManager'];

    angular.module('app.ui').component('wSlider', {
        transclude: true,
        bindings: {
            id: '@',
            interval: '@',
            startFrom: '@'
        },
        controller: Slider,
        templateUrl: 'modules/ui/directives/slider/slider.html'
    });
})();

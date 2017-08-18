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
                this.stopInterval();
            }, () => {
                this.initializeInterval();
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

                this.initializeInterval();

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
                this.timer = this.$timeout(() => this._step(), this.interval);
            }
        }

        stopInterval() {
            if (this.interval && this.timer) {
                this.$timeout.cancel(this.timer);
                this.timer = null;
            }
        }

        /**
         * @param {number} active
         * @param {number} old
         * @returns Promise
         * @private
         */
        _move(active, old) {
            const direction = active > old;
            const $active = this.content.eq(active);
            const $old = this.content.eq(old);

            let collection;
            let targetLeft;

            if (direction) {
                $active.css('left', '100%');
                $old.css('left', '0');
                this.node.append($active);
                collection = $old.add($active);
                targetLeft = '-=100%';
            } else {
                $old.css('left', '0');
                this.node.prepend($active);
                $active.css('left', '-100%');
                collection = $active.add($old);
                targetLeft = '+=100%';
            }

            return new Promise((resolve) => {
                collection.stop()
                    .animate({ left: targetLeft }, () => {
                        $old.remove();
                        $active.css('left', '');
                        resolve();
                    });
            });
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

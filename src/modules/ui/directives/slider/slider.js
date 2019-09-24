(function () {
    'use strict';

    /**
     * @param {ng.IAugmentedJQuery} $element
     * @param {ng.IScope} $scope
     * @return {Slider}
     */
    const controller = function ($element, $scope) {

        class Slider {

            constructor() {
                /**
                 * @type {number}
                 */
                this.interval = null;
                /**
                 * @type {number}
                 */
                this.active = 0;
                /**
                 * @type {ng.IAugmentedJQuery}
                 */
                this.slides = null;
                /**
                 * @type {number}
                 * @private
                 */
                this._length = null;
                /**
                 * @type {number}
                 * @private
                 */
                this._timer = null;
                /**
                 * @type {ng.IAugmentedJQuery}
                 * @private
                 */
                this._contentEl = null;
            }

            $postLink() {
                this.interval = Number(this.interval) || 0;
                this._contentEl = $element.find('.ui-slider__content');
                this.slides = this._contentEl.children();
                this._length = this.slides.length;

                $element.hover(() => {
                    this.stopInterval();
                }, () => {
                    this.initializeInterval();
                });

                this.initializeInterval();
            }

            /**
             * @param {number} index
             * @param {Event} [event]
             */
            slideTo(index, event) {
                if (index >= 0 && index < this._length && index !== this.active) {
                    this.active = index;
                    this.stopInterval();
                    this._contentEl.css('transform', `translateX(-${this.active * 100}%)`);
                    this.initializeInterval();

                    if (!event) {
                        $scope.$digest();
                    }
                }
            }

            next() {
                this.slideTo(this.active + 1);
            }

            prev() {
                this.slideTo(this.active - 1);
            }

            initializeInterval() {
                if (this.interval) {
                    this.stopInterval();
                    this._timer = setTimeout(() => this._step(), this.interval);
                }
            }

            stopInterval() {
                if (this.interval && this._timer) {
                    clearTimeout(this._timer);
                    this._timer = null;
                }
            }

            _step() {
                if (this.active === this._length - 1) {
                    this.slideTo(0);
                } else {
                    this.next();
                }
            }

        }

        return new Slider();
    };

    controller.$inject = ['$element', '$scope'];

    angular.module('app.ui').component('wSlider', {
        transclude: true,
        bindings: {
            interval: '<'
        },
        controller: controller,
        templateUrl: 'modules/ui/directives/slider/slider.html'
    });
})();

(function () {
    'use strict';

    class SliderDots {

        /**
         * @constructor
         * @param {SliderManager} sliderManager
         */
        constructor(sliderManager) {
            /**
             * @type {string}
             */
            this.sliderId = null;
            /**
             * @type {Array}
             */
            this.dots = [];
            /**
             * @type {Slider}
             */
            this.slider = null;
            this.$postLink = () => {
                this.slider = sliderManager.getSlider(this.sliderId)
                    .then((slider) => {
                        this.slider = slider;
                        this.initialize();
                    });
            };
        }

        initialize() {
            const loop = (i) => {
                const dot = Object.create(null);
                dot.index = i;
                Object.defineProperty(dot, 'active', {
                    get: () => {
                        return this.slider.getActive() === i;
                    }
                });
                this.dots.push(dot);
            };
            for (let i = 0; i < this.slider.length; i++) {
                loop(i);
            }
        }

        getClass(dot) {
            return dot.active ? 'active' : '';
        }

        onClick(dot) {
            if (!dot.active) {
                this.slider.goTo(dot.index);
            }
        }

    }

    SliderDots.$inject = ['sliderManager'];

    angular.module('app.ui').component('wSliderDots', {
        transclude: true,
        bindings: {
            sliderId: '@'
        },
        controller: SliderDots,
        templateUrl: 'modules/ui/directives/sliderDots/dots.html'
    });
})();

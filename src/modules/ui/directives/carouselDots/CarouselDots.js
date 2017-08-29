(function () {
    'use strict';

    class CarouselDots {

        /**
         * @constructor
         * @param {CarouselManager} carouselManager
         */
        constructor(carouselManager) {
            /**
             * @type {string}
             */
            this.sliderId = null;
            /**
             * @type {Array}
             */
            this.dots = [];
            /**
             * @type {Carousel}
             */
            this.slider = null;
            this.$postLink = () => {
                this.slider = carouselManager.getSlider(this.sliderId)
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

    CarouselDots.$inject = ['carouselManager'];

    angular.module('app.ui').component('wCarouselDots', {
        transclude: true,
        bindings: {
            sliderId: '@'
        },
        controller: CarouselDots,
        templateUrl: 'modules/ui/directives/carouselDots/dots.html'
    });
})();

(function () {
    'use strict';

    const factory = function ($q) {

        class CarouselManager {

            constructor() {
                this.slidersHash = Object.create(null);
                this.promiseHash = Object.create(null);
                this.defersHash = Object.create(null);
            }

            /**
             * @param {string} id
             * @param {Carousel} slider
             */
            registerSlider(id, slider) {
                this.slidersHash[id] = slider;
                if (this.defersHash[id]) {
                    this.defersHash[id].resolve(slider);
                    delete this.promiseHash[id];
                }
                if (this.promiseHash[id]) {
                    delete this.promiseHash[id];
                }
            }

            /**
             * @param {string} id
             */
            removeSlider(id) {
                if (this.slidersHash[id]) {
                    delete this.slidersHash[id];
                }
                if (this.promiseHash[id]) {
                    delete this.promiseHash[id];
                }
                if (this.defersHash[id]) {
                    delete this.defersHash[id];
                }
            }

            /**
             * @param {string} id
             * @return {Carousel}
             */
            getSlider(id) {
                if (this.slidersHash[id]) {
                    return $q.when(this.slidersHash[id]);
                } else if (this.promiseHash[id]) {
                    return this.promiseHash[id];
                } else {
                    const defer = $q.defer();
                    this.promiseHash[id] = defer.promise;
                    this.defersHash[id] = defer;
                    return this.promiseHash[id];
                }
            }

        }

        return new CarouselManager();
    };

    factory.$inject = ['$q'];

    angular.module('app.ui').factory('carouselManager', factory);
})();

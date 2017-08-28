(function () {
    'use strict';

    const factory = function ($q) {

        class SliderManager {

            constructor() {
                this.slidersHash = Object.create(null);
                this.promiseHash = Object.create(null);
                this.defersHash = Object.create(null);
            }

            /**
             * @param {string} id
             * @param {Slider} slider
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
             * @returns {Slider}
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

        SliderManager.$inject = ['$q'];

        return new SliderManager();
    };

    angular.module('app.ui').factory('sliderManager', factory);
})();

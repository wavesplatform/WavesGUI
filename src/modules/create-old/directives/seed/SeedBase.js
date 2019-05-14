(function () {
    'use strict';

    const ANIMATION_TIME = 100;

    const factory = function (Base, $q) {

        class SeedBase extends Base {

            constructor($container) {
                super();
                /**
                 * @type {JQuery}
                 */
                this.$root = $container;
                /**
                 * @type {string}
                 */
                this.seed = null;
                /**
                 * @type {Array}
                 */
                this.parts = null;
            }

            $postLink() {
                if (!this.seed) {
                    throw new Error('Has no seed!');
                }
                this.parts = this.seed.split(/\s/);
            }

            animate($element, properties, options) {
                // TODO Optimize animations: to transform from left and top
                return $q((resolve) => {
                    options = options || {
                        duration: ANIMATION_TIME
                    };
                    if (!options.duration) {
                        options.duration = ANIMATION_TIME;
                    }
                    if (options.complete) {
                        const origin = options.complete;
                        options.complete = function () {
                            resolve();
                            origin();
                        };
                    } else {
                        options.complete = resolve;
                    }
                    $element.stop(true, true).animate(properties, options);
                });
            }

            /**
             * @param {JQuery} $forClone
             * @return {JQuery}
             */
            createClone($forClone) {

                const $clone = $forClone.clone()
                    .removeClass('write')
                    .removeClass('full')
                    .removeClass('moved')
                    .addClass('read');

                const offset = $forClone.offset();

                this.$root.append($clone);
                $clone.addClass('clone');
                $clone.css({
                    position: 'absolute',
                    margin: '0'
                });
                $clone.offset(offset);

                $forClone.addClass('moved');

                return $clone;
            }

            animateOut($element) {
                return this.animate($element, { opacity: 0 }, {
                    progress: (tween, progress) => {
                        // TODO : check for prefixes
                        $element.css('transform', `scale(${1 - progress})`);
                    }
                });
            }

            animateIn($element) {
                $element.css('opacity', 0);
                return this.animate($element, { opacity: 1 }, {
                    progress: (tween, progress) => {
                        // TODO : check for prefixes
                        $element.css('transform', `scale(${progress})`);
                    }
                });
            }

        }

        return SeedBase;
    };

    factory.$inject = ['Base', '$q'];

    angular.module('app.create').factory('SeedBase', factory);
})();

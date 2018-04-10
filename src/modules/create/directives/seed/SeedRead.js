(function () {
    'use strict';

    const AVAILABLE_TYPES = [
        'read',
        'random'
    ];

    /**
     * @param {typeof SeedBase} SeedBase
     * @param {ISeedService} seedService
     * @param {JQuery} $element
     * @return {Seed}
     */
    const controller = function (SeedBase, seedService, $element) {

        class Seed extends SeedBase {

            constructor() {
                super($element);
                /**
                 * @type {string}
                 */
                this.type = null;
            }

            $postLink() {
                super.$postLink();
                if (!AVAILABLE_TYPES.includes(this.type)) {
                    throw new Error('Wrong type!');
                }
                this._initialize();
            }


            /**
             * @private
             */
            _initialize() {
                if (this.type === 'random') {
                    this._mixSeed();
                    this.receive(seedService.revert, this._revert, this);
                }
            }

            /**
             * @param index
             * @private
             */
            _revert(index) {
                const $target = $element.find('.seed-item').eq(index);
                const $clone = this.createClone($target);
                this.animateIn($clone).then(() => {
                    $target.removeClass('moved');
                    $clone.remove();
                });
            }

            /**
             * @param e
             * @param index
             * @return {null}
             * @private
             */
            _onClick(e, index) {
                const $target = $(e.target);
                if ($target.hasClass('moved')) {
                    return null;
                }
                const word = $target.text().trim();
                const $clone = this.createClone($target);

                this.animateOut($clone).then(() => {
                    $clone.remove();
                    seedService.pick.dispatch({ index, word });
                });
            }

            /**
             * @private
             */
            _mixSeed() {
                for (let i = 0; i < 100; i++) {
                    this.parts.sort(() => {
                        const num = Math.random();

                        if (num < 0.33) {
                            return -1;
                        }

                        if (num > 0.66) {
                            return 1;
                        }

                        return 0;
                    });
                }
            }

        }


        return new Seed();

    };

    controller.$inject = ['SeedBase', 'seedService', '$element'];

    angular.module('app.create').component('wSeedRead', {
        bindings: {
            type: '@',
            seed: '@'
        },
        controller: controller,
        templateUrl: 'modules/create/directives/seed/seed.html'
    });
})();

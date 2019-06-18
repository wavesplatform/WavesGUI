(function () {
    'use strict';

    const factory = function () {

        const STARS_AMOUNT = 5;
        const { range } = require('ramda');

        class RatingStarsFactory {

            /**
             * @public
             * @type {array}
             */
            starsList = [];

            constructor($container, rating, canRate = false) {
                /**
                 * @type {number}
                 */
                this.rating = rating;

                /**
                 * @type {boolean}
                 */
                this.canRate = canRate;

                /**
                 * @type {jQuery}
                 */
                this.$container = $container;

                // this.observe('rating', () => {
                //     const filledAmount = Math.round(this.rating);
                //     const remapStars = index => ({ filled: (index + 1) <= filledAmount });
                //     this.starsList = range(0, STARS_AMOUNT).map(remapStars);
                //     this._render($container);
                // });

                this.update(this.rating);
            }

            _render($container) {
                this.template = `<div class="rating-stars">${this.starsList.map(obj => obj.$star).join('')}</div>`;
                $container.html(this.template);
            }


            // get template() {
            //     return this.template;
            // }

            static getStar(index, filledAmount) {
                return `<div class="rating-stars__star ${(index + 1) <= filledAmount ? 'filled' : ''}"></div>`;
            }

            update(rating) {
                const filledAmount = Math.round(rating);
                const remapStars = index => ({
                    weight: index + 1,
                    $star: RatingStarsFactory.getStar(index, filledAmount)
                });
                this.starsList = range(0, STARS_AMOUNT).map(remapStars);
                this._render(this.$container);
            }


        }

        return RatingStarsFactory;
    };

    // factory.$inject = ['Base'];

    angular.module('app.ui').factory('RatingStarsFactory', factory);

})();

(function () {
    'use strict';

    const factory = function () {

        const STARS_AMOUNT = 5;
        const { range } = require('ramda');
        const tsUtils = require('ts-utils');

        class RatingStarsFactory {

            /**
             * @public
             * @type {array}
             */
            starsStringList = [];

            constructor({ $container, rating, size = 'm', canRate = false, hasBalance }) {
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
                /**
                 * @type {boolean}
                 */
                this.hasBalance = hasBalance;

                this.size = size;
                this.update(this.rating);

                if (this.canRate) {
                    this._initHandlers(this.hasBalance);
                }

                this.voteSignal = new tsUtils.Signal();
            }

            get vote() {
                return this.voteSignal;
            }


            /**
             * @param rating
             * @return {null}
             */
            update(rating) {
                if (!rating) {
                    return null;
                }
                const filledAmount = Math.round(rating);
                const remapStars = index => ({
                    $star: RatingStarsFactory.getStar(index, filledAmount)
                });
                this.starsStringList = range(0, STARS_AMOUNT).map(remapStars);
                this._render(this.$container);
            }

            /**
             * @public
             * @param status
             */
            updateStatus(status) {
                this.hasBalance = status;
                this._initHandlers(this.hasBalance);
            }


            /**
             * @private
             * @param hasBalance
             */
            _initHandlers(hasBalance) {
                this.starsList.forEach(starObj => {
                    if (hasBalance) {
                        starObj.$star.on('click', () => {
                            this.voteSignal.dispatch(starObj.weight);
                        });
                    } else {
                        starObj.$star.off();
                    }

                });
            }

            /**
             * @param $container
             * @private
             */
            _render($container) {
                this.template = `
                <div class="rating-stars ${this.size} ${this.canRate ? 'can-rate' : ''}">
                    ${this.starsStringList.map(obj => obj.$star).join('')}
                </div>`;

                $container.html(this.template);
                this.starsList = this.$container
                    .find('.rating-stars__star')
                    .toArray()
                    .map((star, i) => ({
                        $star: $(star),
                        weight: i + 1
                    }));
            }

            static getStar(index, filledAmount) {
                return `<div class="rating-stars__star ${(index + 1) <= filledAmount ? 'filled' : ''}"></div>`;
            }


        }

        return RatingStarsFactory;
    };

    // factory.$inject = ['Base'];

    angular.module('app.ui').factory('RatingStarsFactory', factory);

})();

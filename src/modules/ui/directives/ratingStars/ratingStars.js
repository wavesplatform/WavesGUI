(function () {
    'use strict';

    const controller = function (Base, user, $scope) {

        const STARS_AMOUNT = 5;
        const { range } = require('ramda');

        class RatingStars extends Base {

            /**
             * @public
             * @type {array}
             */
            starsList = [];

            /**
             * @type {number}
             */
            rating;

            /**
             * @type {boolean}
             */
            canRate;

            constructor() {
                super($scope);

                this.observe('rating', () => {
                    const filledAmount = Math.round(this.rating);
                    const remapStars = index => ({ filled: (index + 1) <= filledAmount });
                    this.starsList = range(0, STARS_AMOUNT).map(remapStars);
                });
            }

            $postLink() {


            }


        }

        return new RatingStars();
    };

    controller.$inject = ['Base', 'user', '$scope'];

    angular.module('app.ui').component('wRatingStars', {
        bindings: {
            rating: '<',
            canRate: '<'
        },
        templateUrl: 'modules/ui/directives/ratingStars/ratingStars.html',
        controller
    });

})();

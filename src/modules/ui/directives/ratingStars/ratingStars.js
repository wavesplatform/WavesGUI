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
             * @private
             * @type {number}
             */
            rating = null;

            /**
             * @private
             * @type {boolean}
             */
            canRate = false;

            constructor() {
                super($scope);

                const filledAmount = Math.round(this.rating);
                const remapStars = index => ({ filled: index <= filledAmount });

                this.starsList = range(0, STARS_AMOUNT).map(remapStars);
            }


        }

        return new RatingStars();
    };

    controller.$inject = ['Base', 'user', '$scope'];

    angular.module('app.ui').component('wRatingStars', {
        templateUrl: 'modules/ui/directives/getStartedLink/ratingStars.html',
        bindings: {
            rating: '<',
            canRate: '<'
        },
        controller
    });

})();

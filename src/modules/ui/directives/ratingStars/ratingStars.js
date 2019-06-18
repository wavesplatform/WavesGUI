(function () {
    'use strict';

    const controller = function (Base, user, $scope, RatingStarsFactory, $element) {

        class RatingStars extends Base {

            constructor() {
                super($scope);

                const ratingStars = new RatingStarsFactory($element, this.rating);

                this.observe('rating', () => {
                    ratingStars.update(this.rating);
                });
            }


        }

        return new RatingStars();
    };

    controller.$inject = ['Base', 'user', '$scope', 'RatingStarsFactory', '$element'];

    angular.module('app.ui').component('wRatingStars', {
        bindings: {
            rating: '<',
            canRate: '<'
        },
        scope: false,
        // templateUrl: 'modules/ui/directives/ratingStars/ratingStars.html',
        controller
    });

})();

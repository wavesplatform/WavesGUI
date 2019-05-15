(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @return {LandingCtrl}
     */

    const controller = function (Base, $scope) {

        class LandingCtrl extends Base {

            constructor() {
                super($scope);
            }

        }

        return new LandingCtrl();
    };

    controller.$inject = ['Base', '$scope'];

    angular.module('app.landing').controller('LandingCtrl', controller);
})();

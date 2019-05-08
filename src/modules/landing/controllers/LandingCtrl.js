(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param {User} user
     * @param {modalManager} modalManager
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

    controller.$inject = ['Base', '$scope', 'user', 'modalManager'];

    angular.module('app.landing').controller('LandingCtrl', controller);
})();

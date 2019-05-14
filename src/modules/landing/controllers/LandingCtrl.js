(function () {
    'use strict';

    // const $ = require('jquery');

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
                this.isNotPhone = $rootScope.isNotPhone;
            }

        }

        return new LandingCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user', 'modalManager'];

    angular.module('app.landing').controller('LandingCtrl', controller);
})();

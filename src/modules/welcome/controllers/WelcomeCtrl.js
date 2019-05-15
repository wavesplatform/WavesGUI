(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @return {WelcomeCtrl}
     */

    const controller = function (Base, $scope) {

        class WelcomeCtrl extends Base {

            constructor() {
                super($scope);
            }

        }

        return new WelcomeCtrl();
    };

    controller.$inject = ['Base', '$scope'];

    angular.module('app.welcome').controller('WelcomeCtrl', controller);
})();

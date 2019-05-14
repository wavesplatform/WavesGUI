(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param {User} user
     * @param {modalManager} modalManager
     * @return {DexWelcomeCtrl}
     */

    const controller = function (Base, $scope) {


        class DexWelcomeCtrl extends Base {

            constructor() {
                super($scope);
            }

        }

        return new DexWelcomeCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user', 'modalManager'];

    angular.module('app.dex-welcome').controller('DexWelcomeCtrl', controller);
})();

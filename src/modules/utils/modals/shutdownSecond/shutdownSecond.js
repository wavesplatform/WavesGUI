(function () {
    'use strict';

    const controller = function (Base, $mdDialog) {

        class ShutdownSecondCtrl extends Base {

            confirm() {
                $mdDialog.hide();
            }

        }

        return new ShutdownSecondCtrl();
    };

    controller.$inject = ['Base', '$mdDialog'];

    angular.module('app.utils').controller('ShutdownSecondCtrl', controller);
})();

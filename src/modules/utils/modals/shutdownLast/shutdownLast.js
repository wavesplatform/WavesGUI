(function () {
    'use strict';

    const controller = function (Base, $mdDialog) {

        class ShutdownLastCtrl extends Base {

            confirm() {
                window.history.go(0);
                $mdDialog.hide();
            }

        }

        return new ShutdownLastCtrl();
    };

    controller.$inject = ['Base', '$mdDialog'];

    angular.module('app.utils').controller('ShutdownLastCtrl', controller);
})();

(function () {
    'use strict';

    const controller = function (Base, $mdDialog) {

        class ShutdownLastCtrl extends Base {

            confirm() {
                window.location.reload();
                $mdDialog.hide();
            }

        }

        return new ShutdownLastCtrl();
    };

    controller.$inject = ['Base', '$mdDialog'];

    angular.module('app.utils').controller('ShutdownLastCtrl', controller);
})();

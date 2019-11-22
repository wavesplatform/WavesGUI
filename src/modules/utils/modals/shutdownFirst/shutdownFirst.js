(function () {
    'use strict';

    const controller = function (Base, $mdDialog) {

        class ShutdownFirstCtrl extends Base {

            confirm() {
                $mdDialog.hide();
            }

        }

        return new ShutdownFirstCtrl();
    };

    controller.$inject = ['Base', '$mdDialog'];

    angular.module('app.utils').controller('ShutdownFirstCtrl', controller);
})();

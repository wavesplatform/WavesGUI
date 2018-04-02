(function () {
    'use strict';

    const controller = function (Base, $scope) {

        class SeedBackupModalsCtrl extends Base {

            constructor() {
                super($scope);
            }

        }

        return new SeedBackupModalsCtrl();
    };

    controller.$inject = ['Base', '$scope', 'seedService'];

    angular.module('app.utils').controller('SeedBackupModalsCtrl', controller);
})();

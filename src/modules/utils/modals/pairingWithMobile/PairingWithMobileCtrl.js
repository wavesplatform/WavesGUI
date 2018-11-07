(function () {
    'use strict';

    const controller = function (Base, $scope) {

        class PairingWithMobileCtrl extends Base {

            constructor() {
                super($scope);
            }

        }

        return new PairingWithMobileCtrl();
    };

    controller.$inject = ['Base', '$scope'];

    angular.module('app.utils').controller('PairingWithMobileCtrl', controller);
})();

(function () {
    'use strict';

    const controller = function (Base, $scope) {

        class RestoreCtrl extends Base {

            constructor() {
                super($scope);
                this.seed = '';
            }

            restore() {
                console.log(this.seed); // TODO!
            }

        }

        return new RestoreCtrl();
    };

    controller.$inject = ['Base', '$scope'];

    angular.module('app.restore').controller('RestoreCtrl', controller);
})();

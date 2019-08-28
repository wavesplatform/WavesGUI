(function () {
    'use strict';

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @return {ImportCtrl}
     */
    const controller = function (Base, $scope, user) {

        class ImportCtrl extends Base {

            constructor() {
                super($scope);
            }

            backState() {
                return user.getLastState();
            }

        }

        return new ImportCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user'];

    angular.module('app.import').controller('ImportCtrl', controller);
})();

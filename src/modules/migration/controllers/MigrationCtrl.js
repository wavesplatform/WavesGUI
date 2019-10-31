(function () {
    'use strict';

    /**
     * @param {Base} Base
     * {$rootScope.Scope} $scope
     * @return {MigrationCtrl}
     */
    const controller = function (
        Base,
        $scope
    ) {

        class MigrationCtrl extends Base {

            constructor() {
                super($scope);
            }

        }

        return new MigrationCtrl();
    };


    controller.$inject = [
        'Base',
        '$scope'
    ];

    angular.module('app.migration')
        .controller('MigrationCtrl', controller);
})();

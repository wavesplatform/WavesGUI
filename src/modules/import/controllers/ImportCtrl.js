(function () {
    'use strict';

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {modalManager} modalManager
     * @return {ImportCtrl}
     */
    const controller = function (Base, $scope, modalManager) {

        class ImportCtrl extends Base {

            constructor() {
                super($scope);
            }

            importFromOld() {
                modalManager.showImportAccountsModal();
            }

        }

        return new ImportCtrl();
    };

    controller.$inject = ['Base', '$scope', 'modalManager'];

    angular.module('app.import').controller('ImportCtrl', controller);
})();

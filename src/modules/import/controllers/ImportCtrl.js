(function () {
    'use strict';

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {modalManager} modalManager
     * @return {ImportCtrl}
     */
    const controller = function (Base, $scope, modalManager, user) {

        class ImportCtrl extends Base {

            constructor() {
                super($scope);
            }

            importFromOld() {
                modalManager.showImportAccountsModal();
            }

            backState() {
                return user.getLastState();
            }

        }

        return new ImportCtrl();
    };

    controller.$inject = ['Base', '$scope', 'modalManager', 'user'];

    angular.module('app.import').controller('ImportCtrl', controller);
})();

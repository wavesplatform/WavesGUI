(function () {
    'use strict';

    const controller = function (Base, $scope) {

        class ImportAccountsCtrl extends Base {

            constructor() {
                super($scope);

                this.pending = true;
                this.userList = [];
            }

        }

        return new ImportAccountsCtrl();
    };

    controller.$inject = ['Base', '$scope'];

    angular.module('app.utils').controller('ImportAccountsCtrl', controller);
})();

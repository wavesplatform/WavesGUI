(function () {
    'use strict';

    const controller = function (Base, $scope) {

        class ImportAccountsCtrl extends Base {

            constructor(importPromise) {
                super($scope);

                this.pending = true;

                importPromise.then(([beta, old]) => {
                    this.pending = false;
                    $scope.$apply();
                    debugger;
                });
            }

        }

        return new ImportAccountsCtrl(this.promise);
    };

    controller.$inject = ['Base', '$scope'];

    angular.module('app.utils').controller('ImportAccountsCtrl', controller);
})();

(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param {User} user
     * @param {$mdDialog} $mdDialog
     * @return {LedgerErrorCtrl}
     */
    const controller = function (Base, $scope) {

        class LedgerErrorCtrl extends Base {

            constructor({ locals }) {
                super($scope);
                this.mode = locals.mode;
                this.loading = true;
            }

        }

        return new LedgerErrorCtrl(this);
    };

    controller.$inject = ['Base', '$scope', '$mdDialog'];

    angular.module('app.ui')
        .controller('LedgerErrorCtrl', controller);
})();

(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param {$mdDialog} $mdDialog
     * @returns {ConfirmTxCtrl}
     */
    const controller = function (Base, $scope, $mdDialog) {

        class ConfirmTxCtrl extends Base {

            constructor({ signable, showValidationErrors }) {
                super($scope);
                this.signable = signable;
                this.showValidationErrors = showValidationErrors;
            }

            back() {
                $mdDialog.cancel();
            }

        }

        return new ConfirmTxCtrl(this.locals);
    };

    controller.$inject = ['Base', '$scope', '$mdDialog'];

    angular.module('app.utils').controller('ConfirmTxCtrl', controller);
})();

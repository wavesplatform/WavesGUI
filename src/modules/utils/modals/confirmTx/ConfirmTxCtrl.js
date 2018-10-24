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

            constructor(tx) {
                super($scope);
                this.signable = ds.signature.getSignatureApi().makeSignable({
                    type: tx.type,
                    data: tx
                });
            }

            back() {
                $mdDialog.cancel();
            }

        }

        return new ConfirmTxCtrl(this.tx);
    };

    controller.$inject = ['Base', '$scope', '$mdDialog'];

    angular.module('app.utils').controller('ConfirmTxCtrl', controller);
})();

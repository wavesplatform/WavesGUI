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

            /**
             * @type {boolean}
             * @private
             */
            _resolveOnClose = false;


            constructor({ signable, showValidationErrors }) {
                super($scope);
                this.signable = signable;
                this.showValidationErrors = showValidationErrors;
            }

            back() {
                $mdDialog.cancel();
            }

            close() {
                if (this._resolveOnClose) {
                    $mdDialog.hide();
                } else {
                    $mdDialog.cancel();
                }
            }

            onSendTransaction() {
                this._resolveOnClose = true;
            }

        }

        return new ConfirmTxCtrl(this.locals);
    };

    controller.$inject = ['Base', '$scope', '$mdDialog'];

    angular.module('app.utils').controller('ConfirmTxCtrl', controller);
})();

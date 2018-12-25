(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param {$mdDialog} $mdDialog
     * @return {ConfirmOrderCtrl}
     */
    const controller = function (Base, $scope, $mdDialog) {

        class ConfirmOrderCtrl extends Base {

            constructor({ locals }) {
                super($scope);
                this.price = locals.price;
            }

            agree() {
                $mdDialog.confirm();
            }

            close() {
                $mdDialog.cancel();
            }

        }

        return new ConfirmOrderCtrl(this);
    };

    controller.$inject = ['Base', '$scope', '$mdDialog'];

    angular.module('app.ui')
        .controller('ConfirmOrderCtrl', controller);
})();

(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param {User} user
     * @param {$mdDialog} $mdDialog
     * @return {SignLedgerCtrl}
     */
    const controller = function (Base, $scope, $mdDialog) {

        class SignLedgerCtrl extends Base {

            constructor({ locals }) {
                super($scope);
                this.mode = locals.mode;
                this.loading = true;
                this.txId = locals.id;
                locals.ledgerPromise().then(
                    () => this.onLoad(),
                    () => this.onError()
                );
            }

            onLoad() {
                $mdDialog.hide();
            }

            onError() {
                $mdDialog.hide();
            }

        }

        return new SignLedgerCtrl(this);
    };

    controller.$inject = ['Base', '$scope', '$mdDialog'];

    angular.module('app.ui')
        .controller('SignLedgerCtrl', controller);
})();

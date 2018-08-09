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
                this.txData = locals.data;

                this.deferred = {};
                this.deferred.promise = new Promise((res, rej) => {
                    this.deferred.resolve = res;
                    this.deferred.reject = rej;
                });

                locals.ledgerPromise().then(
                    () => this.deferred.resolve(),
                    () => this.deferred.reject()
                );

                this.deferred.promise.then(
                    () => this.onLoad(),
                    () => this.onError()
                );
            }

            onClose() {
                this.deferred.reject();
            }

            onLoad() {
                $mdDialog.hide();
                $scope.$destroy();
            }

            onError() {
                $mdDialog.cancel();
                $scope.$destroy();
            }

        }

        return new SignLedgerCtrl(this);
    };

    controller.$inject = ['Base', '$scope', '$mdDialog'];

    angular.module('app.ui')
        .controller('SignLedgerCtrl', controller);
})();

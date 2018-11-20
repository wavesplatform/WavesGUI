(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param {$mdDialog} $mdDialog
     * @return {SignByDeviceCtrl}
     */
    const controller = function (Base, $scope, $mdDialog) {

        class SignByDeviceCtrl extends Base {

            constructor({ locals }) {
                super($scope);
                this.mode = locals.mode;
                this.loading = true;
                this.txId = locals.id;
                this.txData = locals.data;
                this.userType = locals.userType;
                this.isLedger = this.userType === 'ledger';
                this.isKeeper = this.userType === 'wavesKeeper';
                this.deferred = {};
                this.deferred.promise = new Promise((res, rej) => {
                    this.deferred.resolve = res;
                    this.deferred.reject = rej;
                });

                locals.devicePromise().then(
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

        return new SignByDeviceCtrl(this);
    };

    controller.$inject = ['Base', '$scope', '$mdDialog'];

    angular.module('app.ui')
        .controller('SignByDeviceCtrl', controller);
})();

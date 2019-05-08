(function () {
    'use strict';

    const $ = require('jquery');

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {$mdDialog} $mdDialog
     * @return {LoginByDeviceCtrl}
     */
    const controller = function (Base, $scope, $mdDialog) {

        class LoginByDeviceCtrl extends Base {

            /**
             * @type {JQuery.Deferred<Signable>}
             */
            deferred = $.Deferred();
            /**
             * @type {boolean}
             */
            loading = true;
            /**
             * @type {boolean}
             */
            isLedger = false;
            /**
             * @type {boolean}
             */
            isKeeper = false;

            /**
             * @param {Promise} promise
             * @param {string} adapterType
             */
            constructor(callback) {
                super($scope);

                const { promise, type } = callback();
                this.isLedger = type === 'ledger';
                this.isKeeper = type === 'wavesKeeper';

                this.deferred.promise()
                    .then(() => this.onLoad())
                    .catch(error => this.onError(error));

                promise.then(this.deferred.resolve, this.deferred.reject);
            }

            onClose() {
                this.deferred.reject();
            }

            onLoad() {
                $mdDialog.hide();
                $scope.$destroy();
            }

            onError(e) {
                $mdDialog.cancel(e);
                $scope.$destroy();
            }

        }

        return new LoginByDeviceCtrl(this.locals);
    };

    controller.$inject = ['Base', '$scope', '$mdDialog'];

    angular.module('app.utils')
        .controller('LoginByDeviceCtrl', controller);
})();

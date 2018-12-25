(function () {
    'use strict';

    const $ = require('jquery');

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {$mdDialog} $mdDialog
     * @param {User} user
     * @return {LoginByDeviceCtrl}
     */
    const controller = function (Base, $scope, $mdDialog, user) {

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
             */
            constructor(promise) {
                super($scope);

                this.isLedger = user.userType === 'ledger';
                this.isKeeper = user.userType === 'wavesKeeper';

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

    controller.$inject = ['Base', '$scope', '$mdDialog', 'user'];

    angular.module('app.ui')
        .controller('LoginByDeviceCtrl', controller);
})();

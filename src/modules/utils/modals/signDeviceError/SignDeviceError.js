(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param {User} user
     * @param {$mdDialog} $mdDialog
     * @return {SignDeviceErrorCtrl}
     */
    const controller = function (Base, $scope) {

        class SignDeviceErrorCtrl extends Base {

            constructor({ locals }) {
                super($scope);
                this.mode = locals.error;
                this.userType = locals.userType;
                this.userAddress = locals.address;
                this.isLedger = this.userType === 'ledger';
                this.isKeeper = this.userType === 'wavesKeeper';
                this.isPrivateKey = this.userType === 'privateKey';
                this.loading = true;
            }

        }

        return new SignDeviceErrorCtrl(this);
    };

    controller.$inject = ['Base', '$scope', '$mdDialog'];

    angular.module('app.ui')
        .controller('SignDeviceError', controller);
})();

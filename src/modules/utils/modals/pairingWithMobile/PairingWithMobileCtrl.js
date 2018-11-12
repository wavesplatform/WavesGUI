(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param {User} user
     * @return {PairingWithMobileCtrl}
     */
    const controller = function (Base, $scope, user) {

        class PairingWithMobileCtrl extends Base {

            exportUrl = '';

            constructor() {
                super($scope);

                const name = user.name ? `&name=${user.name}` : '';
                const base = window.location.origin;
                this.exportUrl = `${base}/export/${user.address}?encryptedSeed=${user.encryptedSeed}${name}`;
            }

        }

        return new PairingWithMobileCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user'];

    angular.module('app.utils').controller('PairingWithMobileCtrl', controller);
})();

(function () {
    'use strict';

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {User} user
     * @return {PairingWithMobileCtrl}
     */
    const controller = function (Base, $scope, user) {

        class PairingWithMobileCtrl extends Base {

            exportUrl = '';
            userType = user.userType;
            canShowPairing = true;


            constructor() {
                super($scope);

                // const name = user.name ? `&name=${user.name}` : '';
                // const base = window.location.origin;

                ds.signature.getSignatureApi().getSeed()
                    .then(seed => {
                        this.exportUrl = seed;
                    })
                    .catch(() => {
                        this.canShowPairing = false;
                    })
                    .then(() => {
                        $scope.$apply();
                    });
            }

        }

        return new PairingWithMobileCtrl();
    };

    controller.$inject = ['Base', '$scope', 'user'];

    angular.module('app.utils').controller('PairingWithMobileCtrl', controller);
})();

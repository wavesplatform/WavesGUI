(function () {
    'use strict';

    /**
     * @param $mdDialog
     * @param Base
     * @param $scope
     * @return {AddressQrCode}
     */
    const controller = function ($mdDialog, Base, $scope) {

        class AddressQrCode extends Base {

            constructor({ address, asset }) {
                super($scope);
                this.address = address;
                this.asset = asset;
            }

        }

        return new AddressQrCode(this.locals);
    };

    controller.$inject = ['$mdDialog', 'Base', '$scope'];

    angular.module('app.utils')
        .controller('AddressQrCode', controller);
})();

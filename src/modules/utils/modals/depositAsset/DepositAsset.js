(function () {
    'use strict';

    /**
     * @param $mdDialog
     * @param Base
     * @param $scope
     * @return {DepositAsset}
     */
    const controller = function ($mdDialog, Base, $scope) {

        class DepositAsset extends Base {

            constructor({ address, asset }) {
                super($scope);
                this.address = address;
                this.asset = asset;
            }

        }

        return new DepositAsset(this.locals);
    };

    controller.$inject = ['$mdDialog', 'Base', '$scope'];

    angular.module('app.utils').controller('DepositAsset', controller);
})();

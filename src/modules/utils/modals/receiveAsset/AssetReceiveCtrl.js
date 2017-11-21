(function () {
    'use strict';

    /**
     * @param $mdDialog
     * @param Base
     * @param $scope
     * @return {AssetReceiveCtrl}
     */
    const controller = function ($mdDialog, Base, $scope) {

        class AssetReceiveCtrl extends Base {

            constructor({ address, asset }) {
                super($scope);
                this.address = address;
                this.asset = asset;
            }

        }

        return new AssetReceiveCtrl(this.locals);
    };

    controller.$inject = ['$mdDialog', 'Base', '$scope'];

    angular.module('app.utils')
        .controller('AssetReceiveCtrl', controller);
})();

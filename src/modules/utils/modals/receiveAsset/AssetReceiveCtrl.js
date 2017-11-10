(function () {
    'use strict';

    /**
     * @param $mdDialog
     * @param Base
     * @param $scope
     * @param {AssetsService} assetsService
     * @return {AssetReceiveCtrl}
     */
    const controller = function ($mdDialog, Base, $scope) {

        class AssetReceiveCtrl extends Base {

            constructor(address) {
                super($scope);

                this.step = 0;
                this.address = address;
            }

            cancel() {
                $mdDialog.cancel();
            }

            ok() {
                this.step++;
            }

        }

        return new AssetReceiveCtrl(this.locals);
    };

    controller.$inject = ['$mdDialog', 'Base', '$scope', 'assetsService'];

    angular.module('app.utils')
        .controller('AssetReceiveCtrl', controller);
})();

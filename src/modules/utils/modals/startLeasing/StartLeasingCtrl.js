(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param {Waves} waves
     * @return {StartLeasingCtrl}
     */
    const controller = function (Base, $scope, waves) {

        class StartLeasingCtrl extends Base {

            constructor() {
                super($scope);
                this.step = 0;
                this.assetId = WavesApp.defaultAssets.WAVES;
                this.recipient = '';
                this.ampunt = new BigNumber(0);

                waves.node.assets.info(this.assetId)
                    .then((info) => {
                        this.asset = info;
                    });
            }

            submit() {
                this.step++;
            }

        }

        return new StartLeasingCtrl();
    };

    controller.$inject = ['Base', '$scope', 'waves'];

    angular.module('app.ui').controller('StartLeasingCtrl', controller);
})();

(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param {Waves} waves
     * @param {app.i18n} i18n
     * @return {StartLeasingCtrl}
     */
    const controller = function (Base, $scope, waves, i18n) {

        class StartLeasingCtrl extends Base {

            constructor() {
                super($scope);
                this.step = 0;
                /**
                 * @type {string}
                 */
                this.title = '';
                this.assetId = WavesApp.defaultAssets.WAVES;
                this.recipient = '3PCAB4sHXgvtu5NPoen6EXR5yaNbvsEA8Fj'; // TODO! Remove!. Author Tsigel at 24/11/2017 18:37
                this.ampunt = new BigNumber(0);

                this.observe('step', this._onChangeStep);
                this._onChangeStep();

                waves.node.fee('lease').then(([money]) => {
                    this.fee = money;
                });

                waves.node.assets.balance(this.assetId)
                    .then((info) => {
                        this.asset = info;
                    });
            }

            submit() {
                this.step++;
            }

            _onChangeStep() {
                switch (this.step) {
                    case 0:
                    case 1:
                        this.title = i18n.translate('modal.startLease.title', 'app.utils');
                        break;
                    case 2:
                        this.title = i18n.translate('modal.startLease.titleComplete', 'app.utils');
                        break;
                    default:
                        throw new Error('Wrong step!');
                }
            }

        }

        return new StartLeasingCtrl();
    };

    controller.$inject = ['Base', '$scope', 'waves', 'i18n'];

    angular.module('app.ui').controller('StartLeasingCtrl', controller);
})();

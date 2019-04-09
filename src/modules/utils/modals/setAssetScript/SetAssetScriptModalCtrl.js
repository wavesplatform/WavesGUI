(function () {
    'use strict';

    const controller = function (Base, $scope) {

        class SetAssetScriptModalCtrl extends Base {

            /**
             * @param {object}
             * @type {null}
             */
            state;
            /**
             * @type {Signable}
             */
            signable;
            /**
             * @type {number}
             */
            step = 0;


            constructor(assetId) {
                super($scope);

                this.state = { assetId };
            }

            /**
             * @param {Signable} signable
             */
            onFillTxForm(signable) {
                this.signable = signable;
                const { assetId, script } = this.signable.getTxData();
                this.state = { assetId, script };
                this.step++;
            }

            onConfirmBack() {
                this.step--;
            }

        }

        return new SetAssetScriptModalCtrl(this.locals);
    };

    controller.$inject = ['Base', '$scope'];

    angular.module('app.utils').controller('SetAssetScriptModalCtrl', controller);
})();

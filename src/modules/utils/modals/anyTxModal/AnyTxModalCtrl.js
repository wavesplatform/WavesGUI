(function () {
    'use strict';

    const controller = function (Base, $scope) {

        class AnyTxModalCtrl extends Base {

            /**
             * @param {object}
             * @type {null}
             */
            state = null;
            /**
             * @type {null}
             */
            signable = null;
            /**
             * @type {number}
             */
            step = 0;


            constructor(tx) {
                super($scope);

                this.state = { tx };
            }

            onFillTxForm(signable) {
                this.signable = signable;
                this.step++;
            }

            onConfirmBack() {
                this.step--;
            }

        }

        return new AnyTxModalCtrl(this.locals);
    };

    controller.$inject = ['Base', '$scope'];

    angular.module('app.utils').controller('AnyTxModalCtrl', controller);
})();

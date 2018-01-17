(function () {
    'use strict';

    const controller = function (Base, $attrs) {

        class ConfirmTransaction extends Base {

            constructor() {
                super();

                this.locale = $attrs.locale || 'app.ui';
                this.step = 0;
            }

            confirm() {
                this.step++;
            }

            showTxInfo() {

            }

        }

        return new ConfirmTransaction();
    };

    controller.$inject = ['Base', '$attrs'];

    angular.module('app.ui').component('wConfirmTransaction', {
        bindings: {
            tx: '<',
            onClickBack: '&'
        },
        templateUrl: 'modules/ui/directives/confirmTransaction/confirmTransaction.html',
        transclude: false,
        controller
    });
})();

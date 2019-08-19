(function () {
    'use strict';

    const controller = function () {

        class BankSend {

            constructor() {
                this.test = 0;
            }

        }

        return new BankSend();
    };

    controller.$inject = [];

    angular.module('app.ui').component('wBankSend', {
        bindings: {
            state: '<',
            onContinue: '&'
        },
        templateUrl: 'modules/utils/modals/sendAsset/components/singleSend/bankSend/bank-send.html',
        transclude: true,
        controller
    });
})();

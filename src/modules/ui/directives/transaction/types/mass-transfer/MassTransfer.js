(function () {
    'use strict';

    angular.module('app.ui').component('wMassTransfer', {
        bindings: {
            props: '<'
        },
        templateUrl: 'modules/ui/directives/transaction/types/mass-transfer/mass-transfer.html'
    });
})();

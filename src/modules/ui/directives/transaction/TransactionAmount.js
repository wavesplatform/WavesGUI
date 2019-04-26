(function () {
    'use strict';

    angular.module('app.ui').component('wTransactionAmount', {
        bindings: {
            params: '<',
            typeName: '<'
        },
        templateUrl: 'modules/ui/directives/transaction/transaction-amount.html'
    });
})();

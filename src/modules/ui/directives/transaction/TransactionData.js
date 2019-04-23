(function () {
    'use strict';

    angular.module('app.ui').component('wTransactionData', {
        bindings: {
            transaction: '<'
        },
        templateUrl: 'modules/ui/directives/transaction/transaction-data.html'
    });
})();

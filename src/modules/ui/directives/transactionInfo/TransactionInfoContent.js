(function () {
    'use strict';

    angular.module('app.ui').component('wTransactionInfoContent', {
        bindings: {
            signable: '<',
            confirmed: '<'
        },
        templateUrl: 'modules/ui/directives/transactionInfo/transaction-info-content.html'
    });
})();

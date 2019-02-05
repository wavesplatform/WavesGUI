(function () {
    'use strict';

    angular.module('app.ui').component('wTransactionInfoContent', {
        bindings: {
            signable: '<'
        },
        templateUrl: 'modules/ui/directives/transactionInfo/transaction-info-content.html'
    });
})();

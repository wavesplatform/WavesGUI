(function () {
    'use strict';

    angular.module('app.ui').component('wTransactionIcon', {
        bindings: {
            typeName: '<'
        },
        templateUrl: 'modules/ui/directives/transaction/transaction-icon.html'
    });
})();

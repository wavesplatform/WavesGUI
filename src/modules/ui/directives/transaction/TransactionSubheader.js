(function () {
    'use strict';

    angular.module('app.ui').component('wTransactionSubheader', {
        bindings: {
            typeName: '<'
        },
        templateUrl: 'modules/ui/directives/transaction/transaction-subheader.html'
    });
})();

(function () {
    'use strict';

    const controller = function (Base) {

        class TransactionExport extends Base {

        }

        return new TransactionExport();
    };

    controller.$inject = ['Base'];

    angular.module('app.ui').component('wTransactionExport', {
        controller,
        scope: false,
        bindings: {
            link: '<'
        },
        templateUrl: 'modules/ui/directives/transactionExport/transaction-export.html'
    });
})();

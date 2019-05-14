(function () {
    'use strict';

    const controller = function (Base) {

        class TransactionExport extends Base {

            copyLink() {
                // analytics.push('ExportTransaction', 'ExportTransaction.CopyTransactionLink');
            }

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

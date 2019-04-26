(function () {
    'use strict';

    /**
     * @param $filter
     * @return {TransactionInfoRow}
     */

    const controller = function ($filter) {

        class TransactionInfoRow {

            $postLink() {
                this.type = this.transaction.type;
                this.props = {
                    ...this.transaction,
                    time: $filter('date')(this.transaction.timestamp, this.datePattern || 'HH:mm'),
                    isScam: this.isScam
                };
            }

        }

        return new TransactionInfoRow();
    };

    controller.$inject = [
        '$filter'
    ];

    angular.module('app.ui').component('wTransactionInfoRow', {
        bindings: {
            transaction: '<',
            datePattern: '<',
            isScam: '<'
        },
        templateUrl: 'modules/ui/directives/transaction/transaction-info-row.html',
        controller
    });
})();

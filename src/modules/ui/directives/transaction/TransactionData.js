(function () {
    'use strict';

    /**
     * @param $filter
     * @return {TransactionData}
     */

    const controller = function ($filter) {

        class TransactionData {

            $postLink() {
                this.type = this.transaction.type;
                this.props = {
                    ...this.transaction,
                    time: $filter('date')(this.transaction.timestamp, this.datePattern || 'HH:mm')
                };
            }

        }

        return new TransactionData();
    };

    controller.$inject = [
        '$filter'
    ];

    angular.module('app.ui').component('wTransactionData', {
        bindings: {
            transaction: '<',
            datePattern: '<'
        },
        templateUrl: 'modules/ui/directives/transaction/transaction-data.html',
        controller
    });
})();

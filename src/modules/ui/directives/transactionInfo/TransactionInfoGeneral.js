(function () {
    'use strict';

    const controller = function () {

        class TransactionInfoGeneral {

            /**
             * @type {number}
             */
            height;
            /**
             * @type {string}
             */
            id;
            /**
             * @type {Money}
             */
            fee;

        }

        return new TransactionInfoGeneral();
    };

    angular.module('app.ui').component('wTransactionInfoGeneral', {
        bindings: {
            timestamp: '<',
            height: '<',
            id: '<',
            fee: '<'
        },
        controller,
        templateUrl: 'modules/ui/directives/transactionInfo/transaction-info-general.html'
    });
})();

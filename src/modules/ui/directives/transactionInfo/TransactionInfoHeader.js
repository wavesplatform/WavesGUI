(function () {
    'use strict';

    /**
     * @param {app.utils} utils
     * @return {TransactionInfoHeader}
     */
    const controller = function (utils) {

        class TransactionInfoHeader {

            /**
             * @type {Signable}
             */
            signable;


            $postLink() {
                this.typeName = utils.getTransactionTypeName(this.signable.getTxData());
            }

        }

        return new TransactionInfoHeader();
    };

    controller.$inject = ['utils'];

    angular.module('app.ui').component('wTransactionInfoHeader', {
        bindings: {
            signable: '<'
        },
        templateUrl: 'modules/ui/directives/transactionInfo/transaction-info-header.html',
        scope: false,
        controller
    });
})();

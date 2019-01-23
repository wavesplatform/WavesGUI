(function () {
    'use strict';

    const { SIGN_TYPE } = require('@waves/signature-adapter');

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
                const isOrder = this.signable.type === SIGN_TYPE.CREATE_ORDER;
                this.typeName = isOrder ? 'create-order' : utils.getTransactionTypeName(this.signable.getTxData());
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

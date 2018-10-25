(function () {
    'use strict';

    const controller = function (waves) {

        class TransactionInfoHeader {

            /**
             * @type {boolean}
             */
            isScam = false;
            /**
             * @type {string}
             */
            typeName = '';
            /**
             * @type {Signable}
             */
            signable = null;

            $postLink() {
                if (!this.signable) {
                    throw new Error('Has no signable!');
                }
                const tx = waves.node.transactions.createTransaction(this.signable.getTxData());
                this.isScam = !!WavesApp.scam[tx.assetId];
                this.typeName = tx.typeName;
            }

        }

        return new TransactionInfoHeader();
    };

    controller.$inject = ['waves'];

    angular.module('app.ui').component('wTransactionInfoHeader', {
        bindings: {
            signable: '<'
        },
        templateUrl: 'modules/ui/directives/transactionInfo/transaction-info-header.html',
        scope: false,
        controller
    });
})();

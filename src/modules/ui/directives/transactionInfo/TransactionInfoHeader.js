(function () {
    'use strict';

    const controller = function (BaseTxInfo, $scope) {

        class TransactionInfoHeader extends BaseTxInfo {

            constructor() {
                super($scope);

                /**
                 * @type {ITransaction}
                 */
                this.transaction = null;
                /**
                 * @type {string}
                 */
                this.txId = null;

                this.templatePostfix = '-header';
            }

        }

        return new TransactionInfoHeader();
    };

    controller.$inject = ['BaseTxInfo', '$scope'];

    angular.module('app.ui').component('wTransactionInfoHeader', {
        bindings: {
            signable: '<'
        },
        templateUrl: 'modules/ui/directives/transactionInfo/transaction-info-header.html',
        scope: false,
        controller
    });
})();

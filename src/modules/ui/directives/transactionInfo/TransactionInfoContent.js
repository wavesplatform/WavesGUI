(function () {
    'use strict';

    /**
     *
     * @param BaseTxInfo
     * @param {$rootScope.Scope} $scope
     * @return {TransactionInfoContent}
     */
    const controller = function (BaseTxInfo, $scope) {

        class TransactionInfoContent extends BaseTxInfo {

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
            }

        }

        return new TransactionInfoContent();
    };

    controller.$inject = ['BaseTxInfo', '$scope'];

    angular.module('app.ui').component('wTransactionInfoContent', {
        bindings: {
            signable: '<'
        },
        templateUrl: 'modules/ui/directives/transactionInfo/transaction-info-content.html',
        controller
    });
})();

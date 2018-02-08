(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param {TransactionsCsvGen} transactionsCsvGen
     * @return {TransactionsCtrl}
     */
    const controller = function (Base, $scope, transactionsCsvGen) {

        class TransactionsCtrl extends Base {

            constructor() {
                super($scope);

                this.syncSettings({ filter: 'wallet.transactions.filter' });
            }

            exportTransactions() {
                transactionsCsvGen.generate(this.transactions);
            }
        }

        return new TransactionsCtrl();
    };

    controller.$inject = ['Base', '$scope', 'transactionsCsvGen'];

    angular.module('app.wallet.transactions').controller('TransactionsCtrl', controller);
})();

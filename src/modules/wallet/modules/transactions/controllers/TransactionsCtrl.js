(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @return {TransactionsCtrl}
     */
    const controller = function (Base, $scope) {

        class TransactionsCtrl extends Base {

            constructor() {
                super($scope);

                this.syncSettings('wallet.transactions.filter');
            }

        }

        return new TransactionsCtrl();
    };

    controller.$inject = ['Base', '$scope'];

    angular.module('app.wallet.transactions').controller('TransactionsCtrl', controller);
})();

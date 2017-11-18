(function () {
    'use strict';

    const PATH = 'modules/utils/modals/transactionInfo/types';

    /**
     *
     * @param Base
     * @param $scope
     * @param $filter
     * @param {TransactionsService} transactionsService
     * @param explorerLinks
     * @return {TransactionInfoCtrl}
     */
    const controller = function (Base, $scope, $filter, transactionsService, explorerLinks) {

        class TransactionInfoCtrl extends Base {

            constructor({ transactionId }) {
                super($scope);
                transactionsService.get(transactionId)
                    .then((transaction) => {
                        this.transaction = transaction;

                        this.templateUrl = `${PATH}/${this.transaction.templateType}.html`;
                        this.datetime = $filter('date')(this.transaction.timestamp, 'dd.MM.yyyy, hh:mm');
                        this.shownAddress = this.transaction.shownAddress;
                        this.type = this.transaction.type;
                        this.confirmations = 0; // TODO!

                        this.explorerLink = explorerLinks.getTxLink(this.transaction.id);
                    });
            }

        }

        return new TransactionInfoCtrl(this.locals);
    };

    controller.$inject = ['Base', '$scope', '$filter', 'transactionsService', 'explorerLinks'];

    angular.module('app.utils').controller('TransactionInfoCtrl', controller);
})();

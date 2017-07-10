(function () {
    'use strict';

    const REFRESH_DELAY = 10 * 1000;


    class HistoryController {

        constructor($scope, $interval, applicationContext, transactionLoadingService) {
            this.transactions = [];

            this.applicationContext = applicationContext;
            this.transactionLoadingService = transactionLoadingService;

            this.refreshTransactions();
            let $intervalId = $interval(this.refreshTransactions.bind(this), REFRESH_DELAY);

            $scope.$on('$destroy', function () {
                if (angular.isDefined($intervalId)) {
                    $interval.cancel($intervalId);
                    $intervalId = undefined;
                }
            });
        }

        refreshTransactions() {
            let txArray;
            this.transactionLoadingService.loadTransactions(applicationContext.account)
                .then((transactions) => {
                    txArray = transactions;

                    return this.transactionLoadingService
                        .refreshAssetCache(this.applicationContext.cache.assets, transactions);
                })
                .then(() => {
                    history.transactions = txArray;
                });
        }
    }


    HistoryController.$inject = ['$scope', '$interval', 'applicationContext', 'transactionLoadingService'];

    angular
        .module('app.history')
        .controller('historyController', HistoryController);
})();

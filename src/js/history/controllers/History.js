(function () {
    'use strict';

    const REFRESH_DELAY = 10 * 1000;

    class History {

        constructor($scope, $interval, applicationContext, transactionLoadingService) {

            this.transactions = [];

            this.applicationContext = applicationContext;
            this.transactionLoadingService = transactionLoadingService;

            this.refreshTransactions();
            let $intervalId = $interval(this.refreshTransactions.bind(this), REFRESH_DELAY);

            $scope.$on(`$destroy`, () => {
                if (angular.isDefined($intervalId)) {
                    $interval.cancel($intervalId);
                    $intervalId = undefined;
                }
            });
        }

        refreshTransactions() {
            let txArray;
            this.transactionLoadingService.loadTransactions(this.applicationContext.account)
                .then((transactions) => {
                    txArray = transactions;

                    return this.transactionLoadingService
                        .refreshAssetCache(this.applicationContext.cache.assets, transactions);
                })
                .then(() => {
                    this.transactions = txArray;
                });
        }

    }

    History.$inject = [`$scope`, `$interval`, `applicationContext`, `transactionLoadingService`];

    angular
        .module(`app.history`)
        .controller(`historyController`, History);
})();

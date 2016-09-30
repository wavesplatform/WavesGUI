(function () {
    'use strict';

    function HistoryController($scope, $interval, applicationContext, transactionLoadingService) {
        var history = this;
        var refreshPromise;
        var refreshDelay = 10 * 1000;

        history.unconfirmed = [];
        history.confirmed = [];

        refreshTransactions();

        refreshPromise = $interval(refreshTransactions, refreshDelay);

        $scope.$on('$destroy', function () {
            if (angular.isDefined(refreshPromise)) {
                $interval.cancel(refreshPromise);
                refreshPromise = undefined;
            }
        });

        function refreshTransactions() {
            transactionLoadingService.loadTransactions(applicationContext.account.address)
                .then(function (transactions) {
                    history.unconfirmed = _.where(transactions, {unconfirmed: true});
                    history.confirmed = _.difference(transactions, history.unconfirmed);
                });
        }
    }

    HistoryController.$inject = ['$scope', '$interval', 'applicationContext', 'transactionLoadingService'];

    angular
        .module('app.history')
        .controller('historyController', HistoryController);
})();

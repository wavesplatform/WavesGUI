(function () {
    'use strict';

    var POLLING_DELAY = 5000,
        DEFAULT_ERROR_MESSAGE = 'Failed to load balance details';

    function LeasingController($interval, constants, applicationContext,
                               leasingService, transactionLoadingService, notificationService) {
        var ctrl = this,
            intervalPromise;

        ctrl.transactions = [];
        ctrl.limitTo = 1000;
        ctrl.balanceDetails = null;

        refreshAll();
        intervalPromise = $interval(refreshAll, POLLING_DELAY);
        ctrl.$onDestroy = function () {
            $interval.cancel(intervalPromise);
        };

        function refreshAll() {
            refreshBalanceDetails();
            refreshLeasingTransactions();
        }

        function refreshBalanceDetails() {
            leasingService
                .loadBalanceDetails(applicationContext.account.address)
                .then(function (balanceDetails) {
                    ctrl.balanceDetails = balanceDetails;
                }).catch(function (e) {
                    if (e) {
                        if (e.data) {
                            notificationService.error(e.data.message);
                        } else if (e.message) {
                            notificationService.error(e.message);
                        } else if (e.statusText) {
                            notificationService.error(e.statusText);
                        } else {
                            notificationService.error(DEFAULT_ERROR_MESSAGE);
                        }
                    } else {
                        notificationService.error(DEFAULT_ERROR_MESSAGE);
                    }
                });
        }

        function refreshLeasingTransactions() {
            transactionLoadingService
                .loadTransactions(applicationContext.account, ctrl.limitTo)
                .then(function (transactions) {
                    ctrl.transactions = transactions.filter(function (tx) {
                        var startLeasing = constants.START_LEASING_TRANSACTION_TYPE,
                            cancelLeasing = constants.CANCEL_LEASING_TRANSACTION_TYPE;
                        return tx.type === startLeasing || tx.type === cancelLeasing;
                    });
                });
        }
    }

    LeasingController.$inject = ['$interval', 'constants.transactions', 'applicationContext',
                                 'leasingService', 'transactionLoadingService', 'notificationService'];

    angular
        .module('app.leasing')
        .component('wavesLeasing', {
            controller: LeasingController,
            templateUrl: 'leasing/component'
        });
})();

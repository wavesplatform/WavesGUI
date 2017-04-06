(function () {
    'use strict';

    function WavesTransactionHistoryController($scope, events, applicationContext,
                                               apiService, leasingRequestService, notificationService, dialogService) {
        var ctrl = this;

        ctrl.cancelLeasing = cancelLeasing;
        ctrl.confirm = {};

        $scope.$on(events.LEASING_CANCEL, function (event, eventData) {
            ctrl.startLeasingTransaction = eventData.startLeasingTransaction;

            ctrl.confirm.recipient = ctrl.startLeasingTransaction.recipient;
            ctrl.confirm.amount = ctrl.startLeasingTransaction.formatted.amount;
            ctrl.confirm.asset = ctrl.startLeasingTransaction.formatted.asset;

            dialogService.open('#cancel-leasing-confirmation');
        });

        function cancelLeasing () {
            //TODO: implement me
            console.log('cancel-leasing');
        }
    }

    WavesTransactionHistoryController.$inject = ['$scope', 'ui.events', 'applicationContext',
        'apiService', 'leasingRequestService', 'notificationService', 'dialogService'];

    angular
        .module('app.shared')
        .component('wavesTransactionHistory', {
            controller: WavesTransactionHistoryController,
            bindings: {
                transactions: '<',
                limitTo: '<'
            },
            templateUrl: 'shared/transaction.history.component'
        });
})();

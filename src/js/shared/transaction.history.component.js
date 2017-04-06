(function () {
    'use strict';

    var DEFAULT_FEE = Money.fromTokens(0.001, Currency.WAV);
    var DEFAULT_ERROR_MESSAGE = 'The Internet connection is lost';

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
            var cancelLeasing = {
                startLeasingTransactionId: ctrl.startLeasingTransaction.id,
                fee: DEFAULT_FEE
            };

            var sender = {
                publicKey: applicationContext.account.keyPair.public,
                privateKey: applicationContext.account.keyPair.private
            };

            var transaction = leasingRequestService.buildCancelLeasingRequest(cancelLeasing, sender);

            apiService.leasing.cancel(transaction)
            .then(function (response) {
                notificationService.notice('Leasing transaction of ' + ctrl.startLeasingTransaction.formatted.amount +
                    ' ' + ctrl.startLeasingTransaction.formatted.asset + ' has been cancelled.');
            })
            .catch(function (exception) {
                if (exception && exception.message) {
                    notificationService.error(exception.message);
                } else {
                    notificationService.error(DEFAULT_ERROR_MESSAGE);
                }

                dialogService.close();
            });
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

(function () {
    'use strict';

    var DEFAULT_ERROR_MESSAGE = 'Failed to load balance details';

    function WavesBalanceDetailsController ($scope, events, applicationContext,
                                            dialogService, leasingService, notificationService) {
        var balance = this;
        balance.details = {};

        function formatMoney(amount) {
            return amount.formatAmount(true) + ' ' + amount.currency.shortName;
        }

        $scope.$on(events.WALLET_DETAILS, function (event, eventData) {
            dialogService.open('#balance-details-dialog');

            leasingService.loadBalanceDetails(applicationContext.account.address).then(function (details) {
                balance.details = {
                    regular: formatMoney(details.regular),
                    effective: formatMoney(details.effective),
                    generating: formatMoney(details.generating)
                };
            }).catch(function (exception) {
                if (exception && exception.message) {
                    notificationService.error(exception.message);
                } else {
                    notificationService.error(DEFAULT_ERROR_MESSAGE);
                }

                dialogService.close();
            });
        });
    }

    WavesBalanceDetailsController.$inject = ['$scope', 'wallet.events', 'applicationContext',
        'dialogService', 'leasingService', 'notificationService'];

    angular
        .module('app.wallet')
        .controller('balanceDetailsController', WavesBalanceDetailsController);
})();

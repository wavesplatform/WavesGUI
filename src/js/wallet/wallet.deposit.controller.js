(function () {
    'use strict';

    function WavesWalletDepositController ($scope, events, coinomatService, dialogService, notificationService,
                                           applicationContext, bitcoinUriService) {
        var deposit = this;
        deposit.bitcoinAddress = '';
        deposit.bitcoinAmount = '';
        deposit.bitcoinUri = '';

        deposit.refreshUri = function () {
            var params = null;
            if (deposit.bitcoinAmount >= 0.01) {
                params = {
                    amount: deposit.bitcoinAmount
                };
            }
            deposit.bitcoinUri = bitcoinUriService.generate(deposit.bitcoinAddress, params);
        };

        $scope.$on(events.WALLET_DEPOSIT, function (event, eventData) {
            deposit.assetBalance = eventData.assetBalance;
            deposit.currency = deposit.assetBalance.currency.displayName;

            if (deposit.assetBalance.currency.id !== Currency.BTC.id) {
                $scope.home.featureUnderDevelopment();

                return;
            }

            dialogService.open('#deposit-dialog');

            coinomatService.getDepositDetails(deposit.assetBalance.currency, applicationContext.account.address)
                .then(function (depositDetails) {
                    deposit.bitcoinAddress = depositDetails.address;
                    deposit.bitcoinUri = bitcoinUriService.generate(deposit.bitcoinAddress);
                })
                .catch(function (exception) {
                    notificationService.error(exception.message);
                });
        });
    }

    WavesWalletDepositController.$inject = ['$scope', 'wallet.events', 'coinomatService', 'dialogService',
        'notificationService', 'applicationContext', 'bitcoinUriService'];

    angular
        .module('app.wallet')
        .controller('walletDepositController', WavesWalletDepositController);
})();

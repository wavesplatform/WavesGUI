(function () {
    'use strict';

    function WavesWalletDepositController ($scope, events, coinomatService, dialogService, notificationService,
                                           applicationContext, bitcoinUri) {
        var deposit = this;
        deposit.bitcoinAddress = '';
        deposit.bitcoinUri = '';
        deposit.clipboardOk = clipboardOk;

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
                    deposit.bitcoinUri = bitcoinUri.generate(deposit.bitcoinAddress);
                })
                .catch(function (exception) {
                    notificationService.error(exception.message);
                });
        });

        function clipboardOk() {
            notificationService.notice('Requisite copied successfully');
        }
    }

    WavesWalletDepositController.$inject = ['$scope', 'wallet.events', 'coinomatService', 'dialogService',
        'notificationService', 'applicationContext', 'bitcoinUri'];

    angular
        .module('app.wallet')
        .controller('walletDepositController', WavesWalletDepositController);
})();

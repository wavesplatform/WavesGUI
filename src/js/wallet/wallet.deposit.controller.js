(function () {
    'use strict';

    var DEFAULT_ERROR_MESSAGE = 'Connection is lost';

    function WavesWalletDepositController ($scope, events, coinomatService, dialogService, notificationService,
                                           applicationContext, bitcoinUriService) {
        var deposit = this;
        deposit.bitcoinAddress = '';
        deposit.bitcoinAmount = '';
        deposit.bitcoinUri = '';
        deposit.minimumAmount = 0.001;
        deposit.cardGatewayUrl = '';

        deposit.refreshUri = function () {
            var params = null;
            if (deposit.bitcoinAmount >= deposit.minimumAmount) {
                params = {
                    amount: deposit.bitcoinAmount
                };
            }
            deposit.bitcoinUri = bitcoinUriService.generate(deposit.bitcoinAddress, params);
        };

        $scope.$on(events.WALLET_DEPOSIT, function (event, eventData) {
            deposit.depositWith = eventData.depositWith;
            deposit.assetBalance = eventData.assetBalance;
            deposit.currency = deposit.assetBalance.currency.displayName;

            if (deposit.assetBalance.currency.id !== Currency.BTC.id &&
                deposit.assetBalance.currency.id !== Currency.WAV.id) {
                $scope.home.featureUnderDevelopment();

                return;
            }

            dialogService.open('#deposit-dialog');

            coinomatService.getDepositDetails(deposit.depositWith, deposit.assetBalance.currency,
                applicationContext.account.address)
                .then(function (depositDetails) {
                    deposit.bitcoinAddress = depositDetails.address;
                    deposit.bitcoinUri = bitcoinUriService.generate(deposit.bitcoinAddress);
                })
                .catch(function (exception) {
                    if (exception && exception.message) {
                        notificationService.error(exception.message);
                    } else {
                        notificationService.error(DEFAULT_ERROR_MESSAGE);
                    }
                });
        });
    }

    WavesWalletDepositController.$inject = ['$scope', 'wallet.events', 'coinomatService', 'dialogService',
        'notificationService', 'applicationContext', 'bitcoinUriService'];

    angular
        .module('app.wallet')
        .controller('walletDepositController', WavesWalletDepositController);
})();

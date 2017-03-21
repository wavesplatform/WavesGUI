(function () {
    'use strict';

    var DEFAULT_ERROR_MESSAGE = 'Connection is lost';

    function WavesWalletDepositController ($scope, $window, events, coinomatService, dialogService, notificationService,
                                           applicationContext, bitcoinUriService) {
        var deposit = this;
        deposit.bitcoinAddress = '';
        deposit.bitcoinAmount = '';
        deposit.bitcoinUri = '';
        deposit.minimumAmount = 0.001;
        deposit.cardGatewayUrl = '';

        deposit.redirectToCardGateway = function () {
            $window.open(deposit.cardGatewayUrl, '_blank');
        };

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
                    deposit.cardGatewayUrl = 'https://indacoin.com/change?amount_pay=25&cur_from=CARDEUR&cur_to=BTC&' +
                        'partner=waves_test&discount=1000&addrOut=' + deposit.bitcoinAddress;

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

    WavesWalletDepositController.$inject = ['$scope', '$window', 'wallet.events', 'coinomatService', 'dialogService',
        'notificationService', 'applicationContext', 'bitcoinUriService'];

    angular
        .module('app.wallet')
        .controller('walletDepositController', WavesWalletDepositController);
})();

(function () {
    'use strict';

    var DEFAULT_ERROR_MESSAGE = 'Connection is lost';

    function WavesWalletDepositController($scope, events, coinomatService, dialogService,
                                          notificationService, applicationContext, bitcoinUriService,
                                          utilsService) {
        var ctrl = this;

        ctrl.btc = {
            bitcoinAddress: '',
            bitcoinAmount: '',
            bitcoinUri: '',
            minimumAmount: 0.01
        };

        ctrl.fiat = {
            verificationLink: 'https://go.idnow.de/coinomat/userdata/' + applicationContext.account.address,
            email: 'support@coinomat.com'
        };

        ctrl.refreshBTCUri = function () {
            var params = null;
            if (ctrl.btc.bitcoinAmount >= ctrl.btc.minimumAmount) {
                params = {
                    amount: ctrl.btc.bitcoinAmount
                };
            }
            ctrl.btc.bitcoinUri = bitcoinUriService.generate(ctrl.btc.bitcoinAddress, params);
        };

        $scope.$on(events.WALLET_DEPOSIT, function (event, eventData) {
            ctrl.depositWith = eventData.depositWith;
            ctrl.assetBalance = eventData.assetBalance;
            ctrl.currency = ctrl.assetBalance.currency.displayName;

            if (ctrl.assetBalance.currency === Currency.BTC && !utilsService.isTestnet()) {
                // Show the BTC deposit popup only on mainnet
                depositBTC();
            } else if (ctrl.assetBalance.currency === Currency.EUR) {
                depositEUR();
            } else if (ctrl.assetBalance.currency === Currency.USD) {
                depositUSD();
            } else {
                $scope.home.featureUnderDevelopment();
            }
        });

        function depositBTC() {
            dialogService.open('#deposit-btc-dialog');

            coinomatService.getDepositDetails(ctrl.depositWith, ctrl.assetBalance.currency,
                applicationContext.account.address)
                .then(function (depositDetails) {
                    ctrl.btc.bitcoinAddress = depositDetails.address;
                    ctrl.btc.bitcoinUri = bitcoinUriService.generate(ctrl.btc.bitcoinAddress);
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

        function depositEUR() {
            dialogService.open('#deposit-eur-dialog');
        }

        function depositUSD() {
            dialogService.open('#deposit-usd-dialog');
        }
    }

    WavesWalletDepositController.$inject = ['$scope', 'wallet.events', 'coinomatService', 'dialogService',
                                            'notificationService', 'applicationContext', 'bitcoinUriService',
                                            'utilsService'];

    angular
        .module('app.wallet')
        .controller('walletDepositController', WavesWalletDepositController);
})();

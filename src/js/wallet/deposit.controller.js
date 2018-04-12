(function () {
    'use strict';

    var DEFAULT_ERROR_MESSAGE = 'Connection is lost';

    function WavesWalletDepositController($scope, events, coinomatService, dialogService, notificationService,
                                          applicationContext, bitcoinUriService, utilsService, $element) {

        var ctrl = this;
        var currencyId = Currency[$element.data('currency')].id;

        ctrl.btc = {
            bitcoinAddress: '',
            bitcoinAmount: '',
            bitcoinUri: '',
            minimumAmount: 0.001
        };

        ctrl.eth = {
            ethereumAddress: '',
            minimumAmount: 0.001
        };

        ctrl.ltc = {
            litecoinAddress: '',
            minimumAmount: 0.001
        };

        ctrl.zec = {
            zcashAddress: '',
            minimumAmount: 0.001
        };

        ctrl.bch = {
            cashAddress: '',
            minimumAmount: 0.001
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

        $scope.$on(events.WALLET_DEPOSIT + currencyId, function (event, eventData) {
            ctrl.depositWith = eventData.depositWith;
            ctrl.assetBalance = eventData.assetBalance;
            ctrl.currency = ctrl.assetBalance.currency.displayName;

            // Show deposit popups only on mainnet
            if (ctrl.assetBalance.currency === Currency.BTC && !utilsService.isTestnet()) {
                depositBTC();
            } else if (ctrl.assetBalance.currency === Currency.ETH && !utilsService.isTestnet()) {
                depositETH();
            } else if (ctrl.assetBalance.currency === Currency.LTC && !utilsService.isTestnet()) {
                depositLTC();
            } else if (ctrl.assetBalance.currency === Currency.ZEC && !utilsService.isTestnet()) {
                depositZEC();
            } else if (ctrl.assetBalance.currency === Currency.BCH && !utilsService.isTestnet()) {
                depositBCH();
            } else if (ctrl.assetBalance.currency === Currency.EUR) {
                depositEUR();
            } else if (ctrl.assetBalance.currency === Currency.USD) {
                depositUSD();
            } else {
                $scope.home.featureUnderDevelopment();
            }
        });

        function catchErrorMessage(e) {
            if (e && e.message) {
                notificationService.error(e.message);
            } else {
                notificationService.error(DEFAULT_ERROR_MESSAGE);
            }
        }

        function depositBTC() {
            coinomatService.getDepositDetails(ctrl.depositWith, ctrl.assetBalance.currency,
                applicationContext.account.address)
                .then(function (depositDetails) {
                    dialogService.open('#deposit-btc-dialog');
                    ctrl.btc.bitcoinAddress = depositDetails.address;
                    ctrl.btc.bitcoinUri = bitcoinUriService.generate(ctrl.btc.bitcoinAddress);
                })
                .catch(catchErrorMessage);
        }

        function depositETH() {
            coinomatService.getDepositDetails(ctrl.depositWith, ctrl.assetBalance.currency,
                applicationContext.account.address)
                .then(function (depositDetails) {
                    dialogService.open('#deposit-eth-dialog');
                    ctrl.eth.ethereumAddress = depositDetails.address;
                })
                .catch(catchErrorMessage);
        }

        function depositLTC() {
            coinomatService.getDepositDetails(ctrl.depositWith, ctrl.assetBalance.currency,
                applicationContext.account.address)
                .then(function (depositDetails) {
                    dialogService.open('#deposit-ltc-dialog');
                    ctrl.ltc.litecoinAddress = depositDetails.address;
                })
                .catch(catchErrorMessage);
        }

        function depositZEC() {
            coinomatService.getDepositDetails(ctrl.depositWith, ctrl.assetBalance.currency,
                applicationContext.account.address)
                .then(function (depositDetails) {
                    dialogService.open('#deposit-zec-dialog');
                    ctrl.zec.zcashAddress = depositDetails.address;
                })
                .catch(catchErrorMessage);
        }

        function depositBCH() {
            coinomatService.getDepositDetails(ctrl.depositWith, ctrl.assetBalance.currency,
                applicationContext.account.address)
                .then(function (depositDetails) {
                    dialogService.open('#deposit-bch-dialog');
                    ctrl.bch.cashAddress = depositDetails.address;
                })
                .catch(catchErrorMessage);
        }

        function depositEUR() {
            dialogService.open('#deposit-eur-dialog');
        }

        function depositUSD() {
            dialogService.open('#deposit-usd-dialog');
        }
    }

    WavesWalletDepositController.$inject = [
        '$scope', 'wallet.events', 'coinomatService', 'dialogService', 'notificationService',
        'applicationContext', 'bitcoinUriService', 'utilsService', '$element'
    ];

    angular
        .module('app.wallet')
        .controller('walletDepositController', WavesWalletDepositController);
})();

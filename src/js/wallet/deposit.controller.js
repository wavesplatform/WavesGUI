(function () {
    'use strict';

    var DEFAULT_ERROR_MESSAGE = 'Connection is lost';

    var euroDepositMailInstructions =
        'Hi,\n' +
        'I want to proceed with KYC&AML verification in order to buy Eurotokens.\n\n' +
        'Attached are my ID scans.\n\n' +
        '<<< INSTRUCTIONS >>>\n' +
        '1) Don’t change subject line of this letter. ' +
            'This is you Waves address that will be used to transfer Eurotokens to.\n' +
        '2) Attach a scan or a photo of your European ID.\n\n' +
        'Scanned documents must:\n' +
        '— Be valid for another 6 months\n' +
        '— Be written with latin letters\n' +
        '— Include your photograph, date of birth, a serial number, and issue/expiration dates\n' +
        '— Be in colour, black and white documents are not accepted\n' +
        '— All edges must be visible\n' +
        '— No editing is allowed\n\n' +
        '3) ONLY EUROPEAN UNION IDs ARE ACCEPTED!!!\n\n' +
        '<<< END of INSTRUCTIONS >>>';

    function WavesWalletDepositController ($scope, events, coinomatService, dialogService, notificationService,
                                           applicationContext, bitcoinUriService) {
        var ctrl = this;

        ctrl.btc = {
            bitcoinAddress: '',
            bitcoinAmount: '',
            bitcoinUri: '',
            minimumAmount: 0.01
        };

        ctrl.eur = {
            email: 'support@coinomat.com',
            subject: applicationContext.account.address,
            body: encodeURIComponent(euroDepositMailInstructions),
            sendEmail: function () {
                var mailUrl = 'mailto:' + ctrl.eur.email + '?subject=' + ctrl.eur.subject + '&body=' + ctrl.eur.body,
                    win = window.open(mailUrl, '_blank');
                setTimeout(function () {
                    win.close();
                }, 500);
            }
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

            if (ctrl.assetBalance.currency === Currency.BTC) {
                depositBTC();
            } else if (ctrl.assetBalance.currency === Currency.EUR) {
                depositEUR();
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
    }

    WavesWalletDepositController.$inject = ['$scope', 'wallet.events', 'coinomatService', 'dialogService',
        'notificationService', 'applicationContext', 'bitcoinUriService'];

    angular
        .module('app.wallet')
        .controller('walletDepositController', WavesWalletDepositController);
})();

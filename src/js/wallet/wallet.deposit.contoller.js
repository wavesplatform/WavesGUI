(function () {
    'use strict';

    function WavesWalletDepositController ($scope, events, coinomatService, dialogService, notificationService) {
        var deposit = this;

        deposit.requisites = [];

        deposit.clipboardOk = clipboardOk;

        $scope.$on(events.WALLET_DEPOSIT, function (event, eventData) {
            deposit.assetBalance = eventData.assetBalance;
            deposit.currency = deposit.assetBalance.currency.displayName;

            if (deposit.assetBalance.currency.id !== Currency.BTC.id) {
                $scope.home.featureUnderDevelopment();

                return;
            }

            deposit.requisites = [
                {
                    name: 'Bitcoin address',
                    value: '14qViLJfdGaP4EeHnDyJbEGQysnCpwn1gZ'
                }
            ];

            dialogService.open('#deposit-dialog');
        });

        function clipboardOk() {
            notificationService.notice('Requisite copied successfully');
        }
    }

    WavesWalletDepositController.$inject = ['$scope', 'wallet.events', 'coinomatService', 'dialogService',
        'notificationService'];

    angular
        .module('app.wallet')
        .controller('walletDepositController', WavesWalletDepositController);
})();

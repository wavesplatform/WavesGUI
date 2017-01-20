(function () {
    'use strict';

    function WavesWalletWithdrawController ($scope, events, dialogService) {
        var withdraw = this;

        withdraw.submitWithdraw = submitWithdraw;

        $scope.$on(events.WALLET_WITHDRAW, function (event, eventData) {
            withdraw.assetBalance = eventData.assetBalance;

            if (withdraw.assetBalance.currency.id !== Currency.BTC.id) {
                $scope.home.featureUnderDevelopment();

                return;
            }

            dialogService.open('#withdraw-dialog');
        });

        function submitWithdraw () {
        }
    }

    WavesWalletWithdrawController.$inject = ['$scope', 'wallet.events', 'dialogService'];

    angular
        .module('app.wallet')
        .controller('walletWithdrawController', WavesWalletWithdrawController);
})();

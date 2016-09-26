(function () {
    'use strict';

    function WalletController($scope) {
        var wallet = this;

        function unimplementedFeature() {
            $scope.home.featureUnderDevelopment();
        }

        wallet.wallets = [
            {
                balance: new Money(0, Currency.USD)
            },
            {
                balance: new Money(0, Currency.EUR)
            },
            {
                balance: new Money(0, Currency.BTC)
            },
            {
                balance: new Money(0, Currency.WAV)
            },
            {
                balance: new Money(0, Currency.CNY)
            }
        ];
        wallet.send = send;
        wallet.withdraw = withdraw;
        wallet.trade = trade;

        function send (currency) {
            switch (currency) {
                case Currency.WAV:

                    break;

                default:
                    unimplementedFeature();
            }
        }

        function withdraw (currency) {
            unimplementedFeature();
        }

        function trade (currency) {
            unimplementedFeature();
        }
    }

    WalletController.$inject = ['$scope'];

    angular
        .module('app.wallet')
        .controller('walletController', WalletController);
})();

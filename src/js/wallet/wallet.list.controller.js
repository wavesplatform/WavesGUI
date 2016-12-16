(function () {
    'use strict';

    var DEFAULT_FEE_AMOUNT = '0.001';

    function WavesWalletListController($scope, $interval, events, applicationContext,
                                       apiService, transactionLoadingService) {
        var walletList = this;
        var refreshPromise;
        var refreshDelay = 10 * 1000;

        function unimplementedFeature() {
            $scope.home.featureUnderDevelopment();
        }

        function findWalletByCurrency(currency) {
            return _.find(walletList.wallets, function (w) {
                return w.balance.currency === currency;
            });
        }

        walletList.wallets = [
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
        walletList.transactions = [];
        walletList.send = send;
        walletList.withdraw = withdraw;
        walletList.trade = trade;

        loadDataFromBackend();

        $scope.$on('$destroy', function () {
            if (angular.isDefined(refreshPromise)) {
                $interval.cancel(refreshPromise);
                refreshPromise = undefined;
            }
        });

        function send (currency) {
            var assetWallet = findWalletByCurrency(currency);
            var wavesWallet = findWalletByCurrency(Currency.WAV);

            $scope.$broadcast(events.WALLET_SEND, {
                assetBalance: assetWallet.balance,
                wavesBalance: wavesWallet.balance
            });
        }

        function withdraw (currency) {
            unimplementedFeature();
        }

        function trade (currency) {
            unimplementedFeature();
        }

        function loadDataFromBackend() {
            refreshWallets();
            refreshTransactions();

            refreshPromise = $interval(function() {
                refreshWallets();
                refreshTransactions();
            }, refreshDelay);
        }

        function refreshWallets() {
            apiService.address.balance(applicationContext.account.address)
                .then(function (response) {
                    var wavesWallet = findWalletByCurrency(Currency.WAV);
                    wavesWallet.balance = Money.fromCoins(response.balance, Currency.WAV);
                });

            apiService.assets.balance(applicationContext.account.address).then(function (response) {
                _.forEach(response.balances, function (assetBalance) {
                    var id = assetBalance.assetId;

                    // adding asset details to cache
                    applicationContext.cache.assets.put(assetBalance.issueTransaction);
                    applicationContext.cache.assets.update(id, assetBalance.balance,
                        assetBalance.reissuable, assetBalance.quantity);
                });

                _.forEach(walletList.wallets, function (wallet) {
                    var asset = applicationContext.cache.assets[wallet.balance.currency.id];
                    if (asset) {
                        wallet.balance = asset.balance;
                    }
                });
            });
        }

        function refreshTransactions() {
            var txArray;
            transactionLoadingService.loadTransactions(applicationContext.account.address)
                .then(function (transactions) {
                    txArray = transactions;

                    return transactionLoadingService.refreshAssetCache(applicationContext.cache.assets, transactions);
                })
                .then(function () {
                    walletList.transactions = txArray;
                });
        }
    }

    WavesWalletListController.$inject = ['$scope', '$interval', 'wallet.events',
        'applicationContext', 'apiService', 'transactionLoadingService'];

    angular
        .module('app.wallet')
        .controller('walletListController', WavesWalletListController);
})();

(function () {
    'use strict';

    var DEFAULT_FEE_AMOUNT = '0.001';

    function WavesWalletListController($scope, $interval, events, applicationContext,
                                       apiService, transactionLoadingService, dialogService) {
        var walletList = this;
        var refreshPromise;
        var refreshDelay = 10 * 1000;

        function sendCommandEvent(event, currency) {
            var assetWallet = findWalletByCurrency(currency);
            var wavesWallet = findWalletByCurrency(Currency.WAV);

            $scope.$broadcast(event, {
                assetBalance: assetWallet.balance,
                wavesBalance: wavesWallet.balance
            });
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
        walletList.deposit = deposit;
        walletList.depositFromCard = depositFromCard;

        loadDataFromBackend();
        patchCurrencyIdsForTestnet();

        $scope.$on('$destroy', function () {
            if (angular.isDefined(refreshPromise)) {
                $interval.cancel(refreshPromise);
                refreshPromise = undefined;
            }
        });

        function send (currency) {
            sendCommandEvent(events.WALLET_SEND, currency);
        }

        function withdraw (currency) {
            sendCommandEvent(events.WALLET_WITHDRAW, currency);
        }

        function deposit (currency) {
            sendCommandEvent(events.WALLET_DEPOSIT, currency);
        }

        function depositFromCard () {
            dialogService.close();

            $scope.$broadcast(events.WALLET_CARD_DEPOSIT, {});
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

        /* AssetId substitution for testnet only.
           Mainnet version uses default asset identifiers.
         */
        function patchCurrencyIdsForTestnet() {
            if ($scope.isTestnet()) {
                Currency.EUR.id = '8zEZuJcKPQmFuYgVe5ZMpxgiPLu5zBhjA6xgdGomQDaP';
                Currency.USD.id = '2aSqCbvCTgvCpwkGsk4mea4tCLG4Zgp69aQDhHNvRUZv';
                Currency.CNY.id = 'D2MNuUyA38pSKoV7F7vpS15Uhw9nw5qfbrGUfCLRNuRo';
                Currency.BTC.id = 'J3gwJZHJBtK9994EXhmEzdHX5dj7bToRuVf7fvJ3GgBq';
            }
        }
    }

    WavesWalletListController.$inject = ['$scope', '$interval', 'wallet.events',
        'applicationContext', 'apiService', 'transactionLoadingService', 'dialogService'];

    angular
        .module('app.wallet')
        .controller('walletListController', WavesWalletListController);
})();

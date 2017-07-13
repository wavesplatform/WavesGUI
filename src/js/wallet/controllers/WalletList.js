(function () {
    'use strict';

    function WalletList($scope, $interval, events, applicationContext, apiService,
                        transactionLoadingService, dialogService) {

        const ctrl = this;
        const refreshDelay = 10 * 1000;

        let refreshPromise;

        function sendCommandEvent(event, currency) {
            const assetWallet = findWalletByCurrency(currency);
            const wavesWallet = findWalletByCurrency(Currency.WAVES);

            $scope.$broadcast(event, {
                assetBalance: assetWallet.balance,
                wavesBalance: wavesWallet.balance
            });
        }

        function findWalletByCurrency(currency) {
            return _.find(ctrl.wallets, (w) => w.balance.currency === currency);
        }

        ctrl.wallets = [
            {
                balance: new Money(0, Currency.USD),
                depositWith: Currency.USD
            },
            {
                balance: new Money(0, Currency.EUR),
                depositWith: Currency.EUR
            },
            {
                balance: new Money(0, Currency.BTC),
                depositWith: Currency.BTC
            },
            {
                balance: new Money(0, Currency.WAVES),
                depositWith: Currency.BTC
            }
        ];

        ctrl.transactions = [];
        ctrl.send = send;
        ctrl.withdraw = withdraw;
        ctrl.deposit = deposit;
        ctrl.depositFromCard = depositFromCard;

        loadDataFromBackend();
        patchCurrencyIdsForTestnet();

        $scope.$on(`$destroy`, () => {
            if (angular.isDefined(refreshPromise)) {
                $interval.cancel(refreshPromise);
                refreshPromise = undefined;
            }
        });

        function send(wallet) {
            sendCommandEvent(events.WALLET_SEND, wallet.balance.currency);
        }

        function withdraw(wallet) {
            sendCommandEvent(events.WALLET_WITHDRAW, wallet.balance.currency);
        }

        function deposit(wallet) {
            if (wallet.balance.currency === Currency.WAVES) {
                depositFromCard(wallet.balance.currency);
            } else {
                $scope.$broadcast(events.WALLET_DEPOSIT, {
                    assetBalance: wallet.balance,
                    depositWith: wallet.depositWith
                });
            }
        }

        function depositFromCard(currency) {
            dialogService.close();
            $scope.$broadcast(events.WALLET_CARD_DEPOSIT, { currency });
        }

        function loadDataFromBackend() {
            refreshWallets();
            refreshTransactions();

            refreshPromise = $interval(() => {
                refreshWallets();
                refreshTransactions();
            }, refreshDelay);
        }

        function refreshWallets() {
            apiService.address.balance(applicationContext.account.address)
                .then((response) => {
                    const wavesWallet = findWalletByCurrency(Currency.WAVES);
                    wavesWallet.balance = Money.fromCoins(response.balance, Currency.WAVES);
                });

            apiService.assets.balance(applicationContext.account.address).then((response) => {
                _.forEach(response.balances, (assetBalance) => {
                    const id = assetBalance.assetId;

                    // adding asset details to cache
                    applicationContext.cache.putAsset(assetBalance.issueTransaction);
                    applicationContext.cache.updateAsset(id, assetBalance.balance,
                        assetBalance.reissuable, assetBalance.quantity);
                });

                _.forEach(ctrl.wallets, (wallet) => {
                    const asset = applicationContext.cache.assets[wallet.balance.currency.id];
                    if (asset) {
                        wallet.balance = asset.balance;
                    }
                });
            });
        }

        function refreshTransactions() {
            let txArray;
            transactionLoadingService.loadTransactions(applicationContext.account)
                .then((transactions) => {
                    txArray = transactions;

                    return transactionLoadingService.refreshAssetCache(applicationContext.cache.assets, transactions);
                })
                .then(() => {
                    ctrl.transactions = txArray;
                });
        }

        // Assets ID substitution for testnet
        function patchCurrencyIdsForTestnet() {
            if ($scope.isTestnet()) {
                Currency.EUR.id = `2xnE3EdpqXtFgCP156qt1AbyjpqdZ5jGjWo3CwTawcux`;
                Currency.USD.id = `HyFJ3rrq5m7FxdkWtQXkZrDat1F7LjVVGfpSkUuEXQHj`;
                Currency.CNY.id = `6pmDivReTLikwYqQtJTv6dTcE59knriaodB3AK8T9cF8`;
                Currency.BTC.id = `Fmg13HEHJHuZYbtJq8Da8wifJENq8uBxDuWoP9pVe2Qe`;
                Currency.invalidateCache();
            }
        }
    }

    WalletList.$inject = [
        `$scope`, `$interval`, `wallet.events`, `applicationContext`, `apiService`,
        `transactionLoadingService`, `dialogService`
    ];

    angular
        .module(`app.wallet`)
        .controller(`walletListController`, WalletList);
})();

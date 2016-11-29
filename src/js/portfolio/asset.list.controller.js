(function () {
    'use strict';

    function WavesAssetListController($scope, $timeout, $interval, events, applicationContext,
                                      apiService, formattingService) {
        var assetList = this;
        var refreshPromise;
        var refreshDelay = 10 * 1000; // refreshing every 10 seconds

        assetList.wavesBalance = new Money(0, Currency.WAV);
        assetList.assets = [];
        assetList.noData = true;
        assetList.assetTransfer = assetTransfer;
        assetList.assetDetails = assetDetails;
        assetList.assetReissue = assetReissue;
        loadDataFromBackend();

        $scope.$on('$destroy', function () {
            if (angular.isDefined(refreshPromise)) {
                $interval.cancel(refreshPromise);
                refreshPromise = undefined;
            }
        });

        function loadDataFromBackend() {
            refreshAssets();
            refreshBalance();

            refreshPromise = $interval(function() {
                refreshAssets();
                refreshBalance();
            }, refreshDelay);
        }

        function assetTransfer(assetId) {
            $scope.$broadcast(events.ASSET_TRANSFER, {
                assetId: assetId,
                wavesBalance: assetList.wavesBalance
            });
        }

        function assetDetails(assetId) {
            $scope.$broadcast(events.ASSET_DETAILS, assetId);
        }

        function assetReissue(assetId) {
            $scope.$broadcast(events.ASSET_REISSUE, {
                assetId: assetId,
                wavesBalance: assetList.wavesBalance
            });
        }

        function tryToLoadAssetDataFromCache(asset) {
            if (angular.isUndefined(applicationContext.cache.assets[asset.id])) {
                asset.balance = 'Loading';

                return false;
            }

            var cached = applicationContext.cache.assets[asset.id];
            if (angular.isNumber(asset.balance)) {
                cached.balance = Money.fromCoins(asset.balance, cached.currency);
                asset.balance = cached.balance.formatAmount();
            }

            asset.name = cached.currency.displayName;
            asset.total = cached.totalTokens.formatAmount();
            asset.timestamp = formattingService.formatTimestamp(cached.timestamp);
            asset.reissuable = cached.reissuable;
            asset.sender = cached.sender;

            return true;
        }

        function refreshBalance() {
            apiService.address.balance(applicationContext.account.address)
                .then(function (response) {
                    assetList.wavesBalance = Money.fromCoins(response.balance, Currency.WAV);
                });
        }

        function refreshAssets() {
            apiService.assets.balance(applicationContext.account.address).then(function (response) {
                var balances = response.balances;
                var assets = [];
                var cacheMiss = [];
                _.forEach(balances, function (assetBalance) {
                    var id = assetBalance.assetId;
                    var asset = {
                        id: id,
                        total: '',
                        name: '',
                        balance: assetBalance.balance,
                        issued: assetBalance.issued
                    };

                    if (!tryToLoadAssetDataFromCache(asset))
                        cacheMiss.push(id);

                    assets.push(asset);
                });

                _.forEach(cacheMiss, function getAssetTransactionInfo(assetId) {
                    apiService.transactions.info(assetId).then(function (response) {
                        // updating data asynchronously to make view changes visible
                        $timeout(function () {
                            var id = response.id;
                            applicationContext.cache.assets.put(response);
                            var index = _.findIndex(assetList.assets, function (asset) {
                                return asset.id === id;
                            });
                            if (index >= 0)
                                tryToLoadAssetDataFromCache(assetList.assets[index]);
                        }, 500);
                    });
                });

                var delay = 1;
                if (assetList.assets.length === 0 && assets.length > 0) {
                    assetList.noData = false;
                    delay = 500; // waiting for 0.5 sec on first data loading attempt
                }

                // to prevent no data message and asset list from displaying simultaneously
                // we need to update
                $timeout(function() {
                    assetList.assets = assets;
                }, delay);
            });
        }
    }

    WavesAssetListController.$inject = ['$scope', '$timeout', '$interval', 'portfolio.events',
        'applicationContext', 'apiService', 'formattingService'];

    angular
        .module('app.portfolio')
        .controller('assetListController', WavesAssetListController);
})();

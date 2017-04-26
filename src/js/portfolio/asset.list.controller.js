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
        assetList.assetMassPay = assetMassPay;
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

        function assetMassPay(assetId) {
            $scope.$broadcast(events.ASSET_MASSPAY, {
                assetId: assetId,
                wavesBalance: assetList.wavesBalance
            });
        }

        function loadAssetDataFromCache(asset) {
            if (angular.isUndefined(applicationContext.cache.assets[asset.id])) {
                asset.balance = 'Loading';

                return;
            }

            var cached = applicationContext.cache.assets[asset.id];
            asset.balance = cached.balance.formatAmount();
            asset.name = cached.currency.displayName;
            asset.total = cached.totalTokens.formatAmount();
            asset.timestamp = formattingService.formatTimestamp(cached.timestamp);
            asset.reissuable = cached.reissuable;
            asset.sender = cached.sender;
        }

        function refreshBalance() {
            apiService.address.balance(applicationContext.account.address)
                .then(function (response) {
                    assetList.wavesBalance = Money.fromCoins(response.balance, Currency.WAV);
                });
        }

        function refreshAssets() {
            var assets = [];
            apiService.assets.balance(applicationContext.account.address).then(function (response) {
                _.forEach(response.balances, function (assetBalance) {
                    var id = assetBalance.assetId;
                    var asset = {
                        id: id,
                        name: ''
                    };

                    // adding asset details to cache
                    applicationContext.cache.putAsset(assetBalance.issueTransaction);
                    applicationContext.cache.updateAsset(id, assetBalance.balance,
                        assetBalance.reissuable, assetBalance.quantity);

                    // adding an asset with positive balance only or your reissuable assets
                    var yourReissuableAsset = assetBalance.reissuable &&
                        assetBalance.issueTransaction.sender === applicationContext.account.address;
                    if (assetBalance.balance !== 0 || yourReissuableAsset) {
                        loadAssetDataFromCache(asset);
                        assets.push(asset);
                    }
                });

                var delay = 1;
                // handling the situation when some assets appeared on the account
                if (assetList.assets.length === 0 && assets.length > 0) {
                    assetList.noData = false;
                    delay = 500; // waiting for 0.5 sec on first data loading attempt
                }

                // handling the situation when all assets were transferred from the account
                if (assetList.assets.length > 0 && assets.length === 0) {
                    assetList.noData = true;
                    delay = 500;
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

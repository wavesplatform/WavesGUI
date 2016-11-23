(function () {
    'use strict';

    function WavesAssetListController($scope, $interval, events, applicationContext,
                                      apiService, formattingService, dialogService) {
        var assetList = this;
        var refreshPromise;
        var refreshDelay = 15 * 1000;

        assetList.assets = [];
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

            refreshPromise = $interval(function() {
                refreshAssets();
            }, refreshDelay);
        }

        function assetTransfer(assetId) {
            $scope.$broadcast(events.ASSET_TRANSFER, assetId);
        }

        function assetDetails(assetId) {
            $scope.$broadcast(events.ASSET_DETAILS, assetId);
        }

        function assetReissue(assetId) {
            $scope.$broadcast(events.ASSET_REISSUE, assetId);
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
                        var id = response.id;
                        applicationContext.cache.assets.put(response);
                        var index = _.findIndex(assetList.assets, function (asset) {
                            return asset.id === id;
                        });
                        tryToLoadAssetDataFromCache(assetList.assets[index]);
                    });
                });

                assetList.assets = assets;
            });
        }
    }

    WavesAssetListController.$inject = ['$scope', '$interval', 'portfolio.events',
        'applicationContext', 'apiService', 'formattingService', 'dialogService'];

    angular
        .module('app.portfolio')
        .controller('assetListController', WavesAssetListController);
})();

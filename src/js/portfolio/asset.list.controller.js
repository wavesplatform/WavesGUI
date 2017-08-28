(function () {
    'use strict';

    function WavesAssetListController($scope, $timeout, $interval, events,
                                      applicationContext, apiService, formattingService) {
        var ctrl = this;
        var refreshPromise;
        var refreshDelay = 10 * 1000;

        ctrl.wavesBalance = new Money(0, Currency.WAVES);
        ctrl.assets = [];
        ctrl.noData = true;
        ctrl.assetTransfer = assetTransfer;
        ctrl.assetDetails = assetDetails;
        ctrl.assetReissue = assetReissue;
        ctrl.assetMassPay = assetMassPay;
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
                wavesBalance: ctrl.wavesBalance
            });
        }

        function assetDetails(assetId) {
            $scope.$broadcast(events.ASSET_DETAILS, assetId);
        }

        function assetReissue(assetId) {
            $scope.$broadcast(events.ASSET_REISSUE, {
                assetId: assetId,
                wavesBalance: ctrl.wavesBalance
            });
        }

        function assetMassPay(assetId) {
            $scope.$broadcast(events.ASSET_MASSPAY, {
                assetId: assetId,
                wavesBalance: ctrl.wavesBalance
            });
        }

        function loadAssetDataFromCache(asset) {
            var cached = applicationContext.cache.assets[asset.id];
            asset.balance = cached.balance;
            asset.name = cached.currency.displayName;
            asset.total = cached.totalTokens.formatAmount();
            asset.timestamp = formattingService.formatTimestamp(cached.timestamp);
            asset.reissuable = cached.reissuable;
            asset.sender = cached.sender;
        }

        function refreshBalance() {
            apiService.address.balance(applicationContext.account.address)
                .then(function (response) {
                    ctrl.wavesBalance = Money.fromCoins(response.balance, Currency.WAVES);
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
                if (ctrl.assets.length === 0 && assets.length > 0) {
                    ctrl.noData = false;
                    delay = 500; // waiting for 0.5 sec on first data loading attempt
                }

                // handling the situation when all assets were transferred from the account
                if (ctrl.assets.length > 0 && assets.length === 0) {
                    ctrl.noData = true;
                    delay = 500;
                }

                // to prevent no data message and asset list from displaying simultaneously
                // we need to update
                $timeout(function() {
                    ctrl.assets = assets.sort(function (a, b) {
                        var aVerified = (a.balance.currency.verified === true) ? '1:' : '0:',
                            bVerified = (b.balance.currency.verified === true) ? '1:' : '0:';

                        // The verified assets go first, then we sort them by timestamp
                        aVerified += new Date(a.timestamp).getTime();
                        bVerified += new Date(b.timestamp).getTime();

                        return (bVerified > aVerified) ? 1 : -1;
                    });
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

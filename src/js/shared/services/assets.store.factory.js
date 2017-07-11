(function () {
    'use strict';

    // TODO : move to the future `appState` service.

    var predefinedAssets = [
        Currency.BTC,
        Currency.USD,
        Currency.EUR,
        Currency.CNY,
        Currency.WCT,
        Currency.MRT
    ];

    angular
        .module('app.shared')
        .factory('assetStoreFactory', [
            '$q', 'apiService', 'matcherApiService', function ($q, apiService, matcherApiService) {
                function AssetStore(address) {
                    this.address = address;
                    this.balances = {};
                    this.promise = $q.when();
                }

                AssetStore.prototype._getBalances = function () {
                    var self = this;
                    this.promise = this.promise
                        .then(function () {
                            return apiService.assets.balance(self.address);
                        })
                        .then(function (response) {
                            response.balances.forEach(function (asset) {
                                self.balances[asset.assetId] = Money.fromCoins(asset.balance, Currency.create({
                                    id: asset.assetId,
                                    displayName: asset.issueTransaction.name,
                                    shortName: asset.issueTransaction.name,
                                    precision: asset.issueTransaction.decimals
                                }));
                            });
                        })
                        .then(apiService.address.balance.bind(apiService.address, self.address))
                        .then(function (response) {
                            self.balances[Currency.WAVES.id] = Money.fromCoins(response.balance, Currency.WAVES);
                        });
                };

                AssetStore.prototype._getPredefined = function () {
                    var self = this;
                    this.promise = this.promise
                        .then(function () {
                            predefinedAssets.forEach(function (asset) {
                                if (!self.balances[asset.id]) {
                                    self.balances[asset.id] = Money.fromCoins(0, asset);
                                }
                            });
                        });
                };

                AssetStore.prototype._getTradedAssets = function () {
                    var self = this;
                    this.promise = this.promise
                        .then(matcherApiService.loadAllMarkets)
                        .then(function (markets) {
                            markets.forEach(function (market) {
                                var amountAsset = market.amountAsset;
                                if (!self.balances[amountAsset.id]) {
                                    self.balances[amountAsset.id] = Money.fromCoins(0, amountAsset);
                                }

                                var priceAsset = market.priceAsset;
                                if (!self.balances[priceAsset.id]) {
                                    self.balances[priceAsset.id] = Money.fromCoins(0, priceAsset);
                                }
                            });
                        });
                };

                AssetStore.prototype.getAll = function () {
                    var self = this;

                    self._getBalances();
                    self._getPredefined();
                    self._getTradedAssets();
                    self.promise = self.promise.then(function () {
                        return Object.keys(self.balances).map(function (key) {
                            return self.balances[key];
                        });
                    });

                    return self.promise;
                };

                AssetStore.prototype.syncGet = function (id) {
                    return this.balances[id];
                };

                AssetStore.prototype.syncGetAsset = function (id) {
                    var item = this.syncGet(id);
                    if (item && item.currency) {
                        return item.currency;
                    }
                };

                AssetStore.prototype.syncGetBalance = function (id) {
                    var item = this.syncGet(id);
                    if (item && item.amount) {
                        return item.amount.toNumber();
                    } else {
                        return 0;
                    }
                };

                var stores = {};

                return {
                    createStore: function (address) {
                        if (!stores[address]) {
                            stores[address] = new AssetStore(address);
                        }
                        return stores[address];
                    }
                };
            }
        ]);
})();

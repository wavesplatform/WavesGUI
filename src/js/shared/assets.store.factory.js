(function () {
    'use strict';

    angular
        .module('app.shared')
        .factory('assetStoreFactory', [
            '$q', 'apiService', 'matcherApiService', function ($q, apiService, matcherApiService) {
                function AssetStore(address) {
                    this.address = address;
                    this.balances = [];
                    this.promise = Promise.resolve();
                }

                AssetStore.prototype.refreshBalances = function () {
                    var self = this,
                        newBalances = [];
                    this.promise = this.promise
                        .then(function () {
                            return apiService.assets.balance(self.address);
                        })
                        .then(function (response) {
                            newBalances = response.balances.map(function (item) {
                                return Money.fromCoins(item.balance, Currency.create({
                                    id: item.assetId,
                                    displayName: item.issueTransaction.name,
                                    shortName: item.issueTransaction.name,
                                    precision: item.issueTransaction.decimals
                                }));
                            });
                        })
                        .then(function () {
                            var defaultAssets = [
                                // WAVES is added below.
                                Currency.BTC,
                                Currency.USD,
                                Currency.EUR,
                                Currency.CNY,
                                Currency.WCT,
                                Currency.MRT
                            ];
                            defaultAssets.forEach(function (asset) {
                                var foundInBalances = _.find(newBalances, function (b) {
                                    return b.currency === asset;
                                });

                                if (!foundInBalances) {
                                    newBalances.push(Money.fromCoins(0, asset));
                                }
                            });
                        })
                        .then(apiService.address.balance.bind(apiService.assets, self.address))
                        .then(function (response) {
                            newBalances.unshift(Money.fromCoins(response.balance, Currency.WAV));
                            self.balances = newBalances;
                        });
                    return this;
                };

                AssetStore.prototype.refreshMarkets = function () {
                    this.promise = this.promise
                        .then(matcherApiService.loadAllMarkets)
                        .then(function (markets) {
                            console.log(markets);
                            var marketAssets = {},
                                q = $q.when();

                            ['first', 'second'].forEach(function (order) {
                                markets.forEach(function (market) {
                                    if (!marketAssets[market[order].id]) {
                                        q = getAssetInfo(market[order].id)
                                            .then(function (info) {
                                                console.log(info);
                                                marketAssets[info.id] = Currency.create({
                                                    id: info.id,
                                                    displayName: info.name,
                                                    shortName: info.name,
                                                    precision: info.decimals
                                                });
                                            });
                                        return q;
                                    }
                                });
                            });
                        });
                };

                AssetStore.prototype.getAll = function () {
                    var self = this;
                    self.refreshBalances();
                    self.promise = self.promise.then(function () {
                        return self.balances.map(_.clone);
                    });
                    return self.promise;
                };

                AssetStore.prototype.syncGet = function (id) {
                    var balances = this.balances,
                        len = balances.length;
                    id = id || '';
                    for (var i = 0; i < len; i++) {
                        if (balances[i].currency.id === id) {
                            return balances[i];
                        }
                    }
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

(function () {
    'use strict';

    var assets = {};

    assets[Currency.WAV.id] = _.extend({verified: true}, Currency.WAV);
    assets[Currency.BTC.id] = _.extend({verified: true}, Currency.BTC);
    // TODO : expand this list.

    angular
        .module('app.shared')
        .service('assetStoreFactory', ['apiService', function (apiService) {
            function AssetStore(address) {
                this.address = address;
                this.balances = [];
                this.promise = Promise.resolve();
                this.refreshBalances();
            }

            AssetStore.prototype.refreshBalances = function () {
                var self = this;
                this.promise = this.promise
                    .then(apiService.assets.balance.bind(apiService.assets, self.address))
                    .then(function (response) {
                        self.balances = response.balances.map(function (item) {
                            return complement({
                                assetId: item.assetId,
                                balance: item.balance,
                                decimals: item.issueTransaction.decimals,
                                displayName: item.issueTransaction.name
                            });
                        });
                    })
                    .then(apiService.address.balance.bind(apiService.assets, self.address))
                    .then(function (response) {
                        self.balances.unshift(complement({
                            balance: response.balance / Math.pow(10, 8),
                            decimals: 8,
                            displayName: 'Waves'
                        }));
                    });
            };

            AssetStore.prototype.getAll = function () {
                var self = this;
                this.promise = this.promise.then(function () {
                    return self.balances.map(_.clone);
                });
                return this.promise;
            };

            // TODO : check if it works properly.
            AssetStore.prototype.getExcept = function (id) {
                var self = this;
                this.promise = this.promise.then(function () {
                    return self.balances.filter(function (asset) {
                        return asset.assetId !== id;
                    }).map(_.clone);
                });
                return this.promise;
            };

            function complement(asset) {
                if (assets[asset.assetId]) {
                    asset.verified = assets[asset.id].verified;
                    asset.shortName = assets[asset.id].shortName;
                } else {
                    asset.shortName = asset.displayName;
                }
                return asset;
            }

            var stores = {};

            return {
                createStore: function (address) {
                    if (!stores[address]) {
                        stores[address] = new AssetStore(address);
                    }
                    return stores[address];
                }
            };
        }]);
})();

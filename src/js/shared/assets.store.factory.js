(function () {
    'use strict';

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
                            return Money.fromCoins(item.balance, new Currency({
                                id: item.assetId,
                                displayName: item.issueTransaction.name,
                                shortName: item.issueTransaction.name,
                                precision: item.issueTransaction.decimals
                            }));
                        });
                    })
                    .then(apiService.address.balance.bind(apiService.assets, self.address))
                    .then(function (response) {
                        self.balances.unshift(Money.fromCoins(response.balance, Currency.WAV));
                    });
                return this;
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

            AssetStore.prototype.syncGetAsset = function (id) {
                var balances = this.balances,
                    len = balances.length;
                id = id || undefined;
                for (var i = 0; i < len; i++) {
                    if (balances[i].currency.id === id) {
                        return balances[i].currency;
                    }
                }
                return null;
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
        }]);
})();

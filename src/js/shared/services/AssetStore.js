(function () {
    'use strict';

    // TODO : move to the future `appState` service.

    const predefinedAssets = [
        Currency.BTC,
        Currency.USD,
        Currency.EUR,
        Currency.CNY,
        Currency.WCT,
        Currency.MRT
    ];

    angular
        .module(`app.shared`)
        .factory(`assetStoreFactory`, [
            `$q`, `apiService`, `matcherApiService`, function ($q, apiService, matcherApiService) {
                function AssetStore(address) {
                    this.address = address;
                    this.balances = {};
                    this.promise = $q.when();
                }

                AssetStore.prototype._getBalances = function () {
                    const self = this;
                    this.promise = this.promise
                        .then(() => apiService.assets.balance(self.address))
                        .then((response) => {
                            response.balances.forEach((asset) => {
                                self.balances[asset.assetId] = Money.fromCoins(asset.balance, Currency.create({
                                    id: asset.assetId,
                                    displayName: asset.issueTransaction.name,
                                    shortName: asset.issueTransaction.name,
                                    precision: asset.issueTransaction.decimals
                                }));
                            });
                        })
                        .then(apiService.address.balance.bind(apiService.address, self.address))
                        .then((response) => {
                            self.balances[Currency.WAVES.id] = Money.fromCoins(response.balance, Currency.WAVES);
                        });
                };

                AssetStore.prototype._getPredefined = function () {
                    const self = this;
                    this.promise = this.promise
                        .then(() => {
                            predefinedAssets.forEach((asset) => {
                                if (!self.balances[asset.id]) {
                                    self.balances[asset.id] = Money.fromCoins(0, asset);
                                }
                            });
                        });
                };

                AssetStore.prototype._getTradedAssets = function () {
                    const self = this;
                    this.promise = this.promise
                        .then(matcherApiService.loadAllMarkets)
                        .then((markets) => {
                            markets.forEach((market) => {
                                const amountAsset = market.amountAsset;
                                if (!self.balances[amountAsset.id]) {
                                    self.balances[amountAsset.id] = Money.fromCoins(0, amountAsset);
                                }

                                const priceAsset = market.priceAsset;
                                if (!self.balances[priceAsset.id]) {
                                    self.balances[priceAsset.id] = Money.fromCoins(0, priceAsset);
                                }
                            });
                        });
                };

                AssetStore.prototype.getAll = function () {
                    const self = this;

                    self._getBalances();
                    self._getPredefined();
                    self._getTradedAssets();
                    self.promise = self.promise.then(() => Object.keys(self.balances).map((key) => self.balances[key]));

                    return self.promise;
                };

                AssetStore.prototype.syncGet = function (id) {
                    return this.balances[id];
                };

                AssetStore.prototype.syncGetAsset = function (id) {
                    const item = this.syncGet(id);
                    if (item && item.currency) {
                        return item.currency;
                    } else {
                        return null;
                    }
                };

                AssetStore.prototype.syncGetBalance = function (id) {
                    const item = this.syncGet(id);
                    if (item && item.amount) {
                        return item.amount.toNumber();
                    } else {
                        return 0;
                    }
                };

                const stores = {};

                return {
                    createStore(address) {
                        if (!stores[address]) {
                            stores[address] = new AssetStore(address);
                        }
                        return stores[address];
                    }
                };
            }
        ]);
})();

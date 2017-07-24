(function () {
    'use strict';

    function ApplicationContext() {

        const assets = Object.create(null);

        return {
            account: Object.create(null),
            cache: {
                assets,
                updateAsset(assetId, balance, reissuable, totalTokens) {
                    const asset = assets[assetId];
                    if (asset) {
                        asset.balance = Money.fromCoins(balance, asset.currency);
                        asset.totalTokens = Money.fromCoins(totalTokens, asset.currency);
                        asset.reissuable = reissuable;
                    }
                },
                putAsset(issueTransaction) {
                    const currency = Currency.create({
                        id: issueTransaction.assetId,
                        displayName: issueTransaction.name,
                        precision: issueTransaction.decimals
                    });
                    const asset = {
                        currency: currency,
                        description: issueTransaction.description,
                        timestamp: issueTransaction.timestamp,
                        sender: issueTransaction.sender,
                        totalTokens: Money.fromCoins(issueTransaction.quantity, currency)
                    };
                    let balance;

                    if (angular.isDefined(assets[currency.id])) {
                        balance = assets[currency.id].balance;
                    } else {
                        balance = new Money(0, currency);
                    }

                    asset.balance = balance;

                    assets[currency.id] = asset;
                },
                getAssetsList() {
                    return Object.keys(assets).map((key) => assets[key]);
                }
            }
        };
    }

    ApplicationContext.$inject = [`constants.transactions`];

    angular
        .module(`app.ui`)
        .factory(`applicationContext`, ApplicationContext);
})();

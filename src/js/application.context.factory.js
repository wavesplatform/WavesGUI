(function () {
    'use strict';

    function ApplicationContextFactory(constants) {

        var assets = {};

        assets.update = function (assetId, balance, reissuable, totalTokens) {
            var asset = assets[assetId];
            if (asset) {
                asset.balance = Money.fromCoins(balance, asset.currency);
                asset.totalTokens = Money.fromCoins(totalTokens, asset.currency);
                asset.reissuable = reissuable;
            }
        };

        assets.put = function (issueTransaction) {
            var currency = Currency.create({
                id: issueTransaction.assetId,
                displayName: issueTransaction.name,
                precision: issueTransaction.decimals
            });
            var balance = new Money(0, currency);
            var asset = {
                currency: currency,
                description: issueTransaction.description,
                timestamp: issueTransaction.timestamp,
                sender: issueTransaction.sender,
                totalTokens: Money.fromCoins(issueTransaction.quantity, currency)
            };

            if (angular.isDefined(assets[currency.id]))
                balance = assets[currency.id].balance;

            asset.balance = balance;

            assets[currency.id] = asset;
        };

        return {
            account: {},
            cache: {
                assets: assets
            }
        };
    }

    ApplicationContextFactory.$inject = ['constants.transactions'];

    angular
        .module('app.ui')
        .factory('applicationContext', ApplicationContextFactory);
})();

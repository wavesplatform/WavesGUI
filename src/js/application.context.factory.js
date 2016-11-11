(function () {
    'use strict';

    function ApplicationContextFactory() {

        var assets = {};

        assets.put = function (issueTransaction) {
            var currency = new Currency({
                id: transaction.assetId,
                displayName: transaction.name,
                precision: transaction.decimals
            });
            var balance = new Money(0, currency);
            var asset = {
                currency: currency,
                description: transaction.description,
                reissuable: transaction.reissuable,
                timestamp: transaction.timestamp,
                totalTokens: Money.fromCoins(transaction.quantity, currency),
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

    ApplicationContextFactory.$inject = [];

    angular
        .module('app.ui')
        .factory('applicationContext', ApplicationContextFactory);
})();

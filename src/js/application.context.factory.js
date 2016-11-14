(function () {
    'use strict';

    function ApplicationContextFactory() {

        var assets = {};

        assets.put = function (issueTransaction) {
            var currency = new Currency({
                id: issueTransaction.assetId,
                displayName: issueTransaction.name,
                precision: issueTransaction.decimals
            });
            var balance = new Money(0, currency);
            var asset = {
                currency: currency,
                description: issueTransaction.description,
                reissuable: issueTransaction.reissuable,
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

    ApplicationContextFactory.$inject = [];

    angular
        .module('app.ui')
        .factory('applicationContext', ApplicationContextFactory);
})();

(function () {
    'use strict';

    function ApplicationContextFactory(constants) {

        var assets = {};

        function updateTotalTokens(assetId, reissuedAmount) {
            var asset = assets[assetId];
            if (angular.isDefined(asset)) {
                var reissued = Money.fromCoins(reissuedAmount, asset.currency);
                asset.totalTokens = asset.totalTokens.plus(reissued);
            }
        }

        assets.grab = function (transactions) {
            var confirmed = _.reject(transactions, function (tx) {
                return tx.unconfirmed;
            });
            var issueTransactions = _.where(confirmed, {type: constants.ASSET_ISSUE_TRANSACTION_TYPE});
            _.map(issueTransactions, assets.put);

            var reissueTransactions = _.where(confirmed, {type: constants.ASSET_REISSUE_TRANSACTION_TYPE});
            var grouped = _.groupBy(reissueTransactions, 'assetId');
            var accumulated = _.mapObject(grouped, function (values) {
                return _.reduce(values, function (memo, tx) {
                    return memo + tx.quantity;
                }, 0);
            });
            _.mapObject(accumulated, function (value, assetId) {
                updateTotalTokens(assetId, value);
            });
        };

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

    ApplicationContextFactory.$inject = ['constants.transactions'];

    angular
        .module('app.ui')
        .factory('applicationContext', ApplicationContextFactory);
})();

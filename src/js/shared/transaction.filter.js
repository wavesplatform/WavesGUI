(function () {
    'use strict';

    function TransactionFilter(constants, applicationContext, formattingService, addressService) {
        var TRANSACTION_SPEC = {};
        TRANSACTION_SPEC[constants.PAYMENT_TRANSACTION_TYPE] = {
            type: 'Payment',
            processor: processPaymentTransaction
        };
        TRANSACTION_SPEC[constants.ASSET_ISSUE_TRANSACTION_TYPE] = {
            type: 'Asset Issue',
            processor: processAssetIssueTransaction
        };
        TRANSACTION_SPEC[constants.ASSET_TRANSFER_TRANSACTION_TYPE] = {
            type: 'Transfer',
            processor: processAssetTransferTransaction
        };
        TRANSACTION_SPEC[constants.ASSET_REISSUE_TRANSACTION_TYPE] = {
            type: 'Asset Reissue',
            processor: processAssetReissueTransaction
        };

        function buildTransactionType (number) {
            var spec = TRANSACTION_SPEC[number];

            return spec ? spec.type : '';
        }

        function transformAddress(rawAddress) {
            var result = angular.isDefined(rawAddress) ? rawAddress : 'n/a';

            if (result === applicationContext.account.address)
                result = 'You';

            return result;
        }

        function processTransaction(transaction) {
            var spec = TRANSACTION_SPEC[transaction.type];
            if (angular.isUndefined(spec) || angular.isUndefined(spec.processor))
                return;

            spec.processor(transaction);
        }

        function processPaymentTransaction(transaction) {
            transaction.formatted.amount = Money.fromCoins(transaction.amount, Currency.WAV).formatAmount();
        }

        function processAssetIssueTransaction(transaction) {
            var asset = new Currency({
                id: transaction.id,
                displayName: transaction.name,
                precision: transaction.decimals
            });
            transaction.formatted.amount = Money.fromCoins(transaction.quantity, asset).formatAmount();
        }

        function processAssetTransferTransaction(transaction) {
            var asset = applicationContext.cache.assets[transaction.assetId];
            if (angular.isUndefined(asset))
                return;

            transaction.formatted.amount = Money.fromCoins(transaction.amount, asset.currency).formatAmount();
        }

        function processAssetReissueTransaction(transaction) {
            var asset = applicationContext.cache.assets[transaction.assetId];
            if (angular.isUndefined(asset))
                return;

            transaction.formatted.amount = Money.fromCoins(transaction.quantity, asset.currency).formatAmount();
        }

        function formatFee(transaction) {
            var currency = Currency.WAV;
            var assetId = transaction.feeAssetId;
            if (angular.isDefined(assetId)) {
                var asset = applicationContext.cache.assets[assetId];
                if (angular.isDefined(asset))
                    currency = asset.currency;
            }

            return Money.fromCoins(transaction.fee, currency).formatAmount(true);
        }

        function formatTransaction(transaction) {
            // in the future currency should be a part of transaction itself
            var currentAddress = applicationContext.account.address;
            var type = transaction.sender === currentAddress ? 'Outgoing' : 'Incoming';

            transaction.formatted = {
                type: type + ' ' + buildTransactionType(transaction.type),
                datetime: formattingService.formatTimestamp(transaction.timestamp),
                isOutgoing: transaction.sender === currentAddress,
                sender: transformAddress(transaction.sender),
                recipient: transformAddress(transaction.recipient),
                amount: 'N/A',
                fee: formatFee(transaction)
            };

            processTransaction(transaction);

            transaction.formatted.isSenderCopiable = addressService.validateAddress(transaction.formatted.sender);
            transaction.formatted.isRecipientCopiable = addressService.validateAddress(transaction.formatted.recipient);

            return transaction;
        }

        return function filterInput(input) {
            return _.map(input, formatTransaction);
        };
    }

    TransactionFilter.$inject = ['constants.transactions', 'applicationContext', 'formattingService', 'addressService'];

    angular
        .module('app.shared')
        .filter('transaction', TransactionFilter);
})();

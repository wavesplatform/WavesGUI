(function () {
    'use strict';

    function TransactionFilter(applicationContext, formattingService, addressService) {
        var TRANSACTION_TYPES = {
            2: 'Payment',
            3: 'Asset Issue',
            4: 'Transfer',
            5: 'Asset Reissue'
        };

        function buildTransactionType (number) {
            return TRANSACTION_TYPES[number] || '';
        }

        function transformAddress(rawAddress) {
            var result = angular.isDefined(rawAddress) ? rawAddress : 'none';

            if (result === applicationContext.account.address)
                result = 'You';

            return result;
        }

        function formatTransaction(transaction) {
            // in the future currency should be a part of transaction itself
            var currency = Currency.WAV;
            var currentAddress = applicationContext.account.address;
            var type = transaction.sender === currentAddress ? 'Outgoing' : 'Incoming';
            var formattedAmount = 'N/A';
            if (angular.isDefined(transaction.amount))
                formattedAmount = Money.fromCoins(transaction.amount, currency).formatAmount();
            if (angular.isDefined(transaction.quantity)) {
                var asset = new Currency({
                    id: transaction.id,
                    displayName: transaction.name,
                    precision: transaction.decimals
                });
                formattedAmount = Money.fromCoins(transaction.quantity, asset).formatAmount();
            }
            var fee = Money.fromCoins(transaction.fee, currency);

            transaction.formatted = {
                type: type + ' ' + buildTransactionType(transaction.type),
                datetime: formattingService.formatTimestamp(transaction.timestamp),
                isOutgoing: transaction.sender === currentAddress,
                sender: transformAddress(transaction.sender),
                recipient: transformAddress(transaction.recipient),
                amount: formattedAmount,
                fee: fee.formatAmount(true)
            };

            transaction.formatted.isSenderCopiable = addressService.validateAddress(transaction.formatted.sender);
            transaction.formatted.isRecipientCopiable = addressService.validateAddress(transaction.formatted.recipient);

            return transaction;
        }

        return function filterInput(input) {
            return _.map(input, formatTransaction);
        };
    }

    TransactionFilter.$inject = ['applicationContext', 'formattingService', 'addressService'];

    angular
        .module('app.shared')
        .filter('transaction', TransactionFilter);
})();

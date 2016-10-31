(function () {
    'use strict';

    function TransactionFilter(applicationContext, formattingService) {
        var TRANSACTION_TYPES = {
            2: 'Payment'
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
            var amount = Money.fromCoins(transaction.amount, currency);
            var fee = Money.fromCoins(transaction.fee, currency);

            transaction.formatted = {
                type: type + ' ' + buildTransactionType(transaction.type),
                datetime: formattingService.formatTimestamp(transaction.timestamp),
                isOutgoing: transaction.sender === currentAddress,
                sender: transformAddress(transaction.sender),
                recipient: transformAddress(transaction.recipient),
                amount: amount.formatAmount(),
                fee: fee.formatAmount(true)
            };

            return transaction;
        }

        return function filterInput(input) {
            return _.map(input, formatTransaction);
        };
    }

    TransactionFilter.$inject = ['applicationContext', 'formattingService'];

    angular
        .module('app.shared')
        .filter('transaction', TransactionFilter);
})();

(function () {
    'use strict';

    function TransactionFilter(applicationContext, formattingService, addressService) {
        var TRANSACTION_TYPES = {
            2: 'Payment'
        };

        function buildTransactionType (number) {
            return TRANSACTION_TYPES[number] || '';
        }

        function transformAddress(rawAddress) {
            var result = !angular.isUndefined(rawAddress) ?
                addressService.fromRawAddress(rawAddress).getDisplayAddress() :
                'none';

            if (result === applicationContext.account.address.getDisplayAddress())
                result = 'You';

            return result;
        }

        function formatTransaction(transaction) {
            // in future currency should be a part of transaction itself
            var currency = Currency.WAV;
            var currentAddress = applicationContext.account.address.getRawAddress();
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

    TransactionFilter.$inject = ['applicationContext', 'formattingService', 'addressService'];

    angular
        .module('app.shared')
        .filter('transaction', TransactionFilter);
})();

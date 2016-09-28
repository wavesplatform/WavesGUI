(function () {
    'use strict';

    angular
        .module('app.wallet')
        .service('transactionMergingService', [function () {
            this.mergeTransactions = function (address, unconfirmed, confirmed) {
                var rawAddress = address.getRawAddress();
                unconfirmed = _.filter(unconfirmed, function (transaction) {
                    return (transaction.sender === rawAddress || transaction.recipient === rawAddress);
                });
                var unconfirmedSignatures = _.map(unconfirmed, function (transaction) {
                    return transaction.signature;
                });
                confirmed = _.filter(confirmed, function (transaction) {
                    return unconfirmedSignatures.indexOf(transaction.signature) === -1;
                });
                unconfirmed = _.map(unconfirmed, function (transaction) {
                    transaction.unconfirmed = true;

                    return transaction;
                });

                return _.union(unconfirmed, confirmed);
            };
        }]);
})();

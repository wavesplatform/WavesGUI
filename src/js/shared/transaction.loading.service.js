(function () {
    'use strict';

    function WavesTransactionLoadingService($q, apiService) {
        var self = this;

        // returns promise that loads and merges unconfirmed and confirmed transactions
        this.loadTransactions = function (address) {
            var unconfirmed;
            return apiService.transactions.unconfirmed()
                .then(function (response) {
                    unconfirmed = response;

                    return apiService.transactions.list(address);
                })
                .then(function (response) {
                    var confirmed = response[0];

                    return self.mergeTransactions(address, unconfirmed, confirmed);
                });
        };

        this.refreshAssetCache = function (cache, transactions) {
            var sequence = $q.defer().resolve();
            _.forEach(transactions, function (tx) {
                if (tx.assetId) {
                    var cached = cache[tx.assetId];
                    if (!cached) {
                        sequence = sequence
                            .then(function () {
                                return apiService.transactions.info(tx.assetId);
                            })
                            .then(function (response) {
                                cache.put(response);
                            });
                    }
                }
            });

            return sequence;
        };

        this.mergeTransactions = function (address, unconfirmed, confirmed) {
            var rawAddress = address;
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
    }

    WavesTransactionLoadingService.$inject = ['$q', 'apiService'];

    angular
        .module('app.shared')
        .service('transactionLoadingService', WavesTransactionLoadingService);
})();

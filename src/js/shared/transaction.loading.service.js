(function () {
    'use strict';

    function WavesTransactionLoadingService($q, constants, apiService) {
        var self = this;

        // returns promise that loads and merges unconfirmed and confirmed transactions
        this.loadTransactions = function (account, limit) {
            var unconfirmed;
            return apiService.transactions.unconfirmed()
                .then(function (response) {
                    unconfirmed = response;

                    return apiService.transactions.list(account.address, limit);
                })
                .then(function (response) {
                    // FIXME : redo this when the API is fixed.
                    if (response[0] instanceof Array) {
                        response = response[0];
                    }

                    return self.mergeTransactions(account, unconfirmed, response);
                });
        };

        this.refreshAssetCache = function (cache, transactions) {
            var sequence = $q.resolve();
            _.forEach(transactions, function (tx) {
                var assetId;
                if (tx.assetId) {
                    assetId = tx.assetId;
                } else if (tx.order1 && tx.order1.assetPair.amountAsset) {
                    assetId = tx.order1.assetPair.amountAsset;
                }
                var feeAssetId;
                if (tx.feeAsset) {
                    feeAssetId = tx.feeAsset;
                }

                var cached;

                if (assetId) {
                    cached = cache.assets[assetId];
                    if (!cached) {
                        sequence = sequence
                            .then(function () {
                                return apiService.transactions.info(assetId);
                            })
                            .then(function (response) {
                                cache.putAsset(response);
                            });
                    }
                }

                if (feeAssetId) {
                    cached = cache.assets[feeAssetId];
                    if (!cached) {
                        sequence = sequence
                            .then(function () {
                                return apiService.transactions.info(feeAssetId);
                            })
                            .then(function (response) {
                                cache.putAsset(response);
                            });
                    }
                }
            });

            return sequence;
        };

        // TODO : refactor with a map.
        this.mergeTransactions = function (account, unconfirmed, confirmed) {
            var rawAddress = account.address;
            unconfirmed = _.filter(unconfirmed, function (transaction) {
                if (transaction.type === constants.EXCHANGE_TRANSACTION_TYPE) {
                    return transaction.order1.senderPublicKey === account.keyPair.public ||
                        transaction.order2.senderPublicKey === account.keyPair.public ||
                        transaction.sender === rawAddress;
                } else {
                    return (transaction.sender === rawAddress || transaction.recipient === rawAddress);
                }
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

    WavesTransactionLoadingService.$inject = ['$q', 'constants.transactions', 'apiService'];

    angular
        .module('app.shared')
        .service('transactionLoadingService', WavesTransactionLoadingService);
})();

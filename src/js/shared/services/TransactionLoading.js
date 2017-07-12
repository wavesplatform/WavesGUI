(function () {
    'use strict';

    function TransactionLoading($q, constants, apiService) {
        const self = this;

        // returns promise that loads and merges unconfirmed and confirmed transactions
        this.loadTransactions = function (account, limit) {
            let unconfirmed;
            return apiService.transactions.unconfirmed()
                .then((response) => {
                    unconfirmed = response;

                    return apiService.transactions.list(account.address, limit);
                })
                .then((response) => {
                    // FIXME : redo this when the API is fixed.
                    if (response[0] instanceof Array) {
                        response = response[0];
                    }

                    return self.mergeTransactions(account, unconfirmed, response);
                });
        };

        this.refreshAssetCache = function (cache, transactions) {
            let sequence = $q.resolve();
            _.forEach(transactions, (tx) => {
                let assetId;
                if (tx.assetId) {
                    assetId = tx.assetId;
                } else if (tx.order1 && tx.order1.assetPair.amountAsset) {
                    assetId = tx.order1.assetPair.amountAsset;
                }

                if (assetId) {
                    const cached = cache[assetId];
                    if (!cached) {
                        sequence = sequence
                            .then(() => apiService.transactions.info(assetId))
                            .then((response) => {
                                cache.put(response);
                            });
                    }
                }
            });

            return sequence;
        };

        // TODO : refactor with a map.
        this.mergeTransactions = function (account, unconfirmed, confirmed) {

            const rawAddress = account.address;
            unconfirmed = _.filter(unconfirmed, (transaction) => {
                if (transaction.type === constants.EXCHANGE_TRANSACTION_TYPE) {
                    return transaction.order1.senderPublicKey === account.keyPair.public ||
                        transaction.order2.senderPublicKey === account.keyPair.public;
                } else {
                    return (transaction.sender === rawAddress || transaction.recipient === rawAddress);
                }
            });

            const unconfirmedSignatures = _.map(unconfirmed, (transaction) => transaction.signature);

            confirmed = _.filter(
                confirmed,
                (transaction) => unconfirmedSignatures.indexOf(transaction.signature) === -1
            );

            unconfirmed = _.map(unconfirmed, (transaction) => {
                transaction.unconfirmed = true;
                return transaction;
            });

            return _.union(unconfirmed, confirmed);
        };
    }

    TransactionLoading.$inject = [`$q`, `constants.transactions`, `apiService`];

    angular
        .module(`app.shared`)
        .service(`transactionLoadingService`, TransactionLoading);
})();

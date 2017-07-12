(function () {
    'use strict';

    function Transaction(constants, applicationContext, formattingService) {
        const TRANSACTION_SPEC = {};
        TRANSACTION_SPEC[constants.PAYMENT_TRANSACTION_TYPE] = {
            type: `Payment`,
            processor: processPaymentTransaction
        };
        TRANSACTION_SPEC[constants.ASSET_ISSUE_TRANSACTION_TYPE] = {
            type: `Asset Issue`,
            processor: processAssetIssueTransaction
        };
        TRANSACTION_SPEC[constants.ASSET_TRANSFER_TRANSACTION_TYPE] = {
            type: `Transfer`,
            processor: processAssetTransferTransaction
        };
        TRANSACTION_SPEC[constants.ASSET_REISSUE_TRANSACTION_TYPE] = {
            type: `Asset Reissue`,
            processor: processAssetReissueTransaction
        };
        TRANSACTION_SPEC[constants.START_LEASING_TRANSACTION_TYPE] = {
            type: `Start Leasing`,
            processor: processStartLeasingTransaction
        };
        TRANSACTION_SPEC[constants.CANCEL_LEASING_TRANSACTION_TYPE] = {
            type: `Cancel Leasing`,
            processor: processCancelLeasingTransaction
        };
        TRANSACTION_SPEC[constants.CREATE_ALIAS_TRANSACTION_TYPE] = {
            type: `Create Alias`,
            processor: processCreateAliasTransaction
        };
        TRANSACTION_SPEC[constants.EXCHANGE_TRANSACTION_TYPE] = {
            type: ``,
            processor: processExchangeTransaction
        };

        function buildTransactionType(number) {
            const spec = TRANSACTION_SPEC[number];

            return spec ? spec.type : ``;
        }

        function transformAddress(rawAddress) {
            let result = angular.isDefined(rawAddress) ? rawAddress : `n/a`;

            if (result === applicationContext.account.address) {
                result = `You`;
            }

            return result;
        }

        function processTransaction(transaction) {
            const spec = TRANSACTION_SPEC[transaction.type];
            if (angular.isUndefined(spec) || angular.isUndefined(spec.processor)) {
                return;
            }

            spec.processor(transaction);
        }

        function processPaymentTransaction(transaction) {
            transaction.formatted.amount = Money.fromCoins(transaction.amount, Currency.WAVES).formatAmount();
            transaction.formatted.asset = Currency.WAVES.displayName;
        }

        function processAssetIssueTransaction(transaction) {
            const asset = Currency.create({
                id: transaction.id,
                displayName: transaction.name,
                precision: transaction.decimals
            });
            transaction.formatted.amount = Money.fromCoins(transaction.quantity, asset).formatAmount();
            transaction.formatted.asset = asset.displayName;
        }

        function processCreateAliasTransaction(transaction) {
            transaction.formatted.asset = Currency.WAVES.displayName;
        }

        function processAssetTransferTransaction(transaction) {
            let currency;
            if (transaction.assetId) {
                const asset = applicationContext.cache.assets[transaction.assetId];
                if (asset) {
                    currency = asset.currency;
                }
            } else {
                currency = Currency.WAVES;
            }

            if (!currency) {
                return;
            }

            transaction.formatted.amount = Money.fromCoins(transaction.amount, currency).formatAmount();
            transaction.formatted.asset = currency.displayName;
        }

        function processAssetReissueTransaction(transaction) {
            const asset = applicationContext.cache.assets[transaction.assetId];
            if (angular.isUndefined(asset)) {
                return;
            }

            transaction.formatted.amount = Money.fromCoins(transaction.quantity, asset.currency).formatAmount();
            transaction.formatted.asset = asset.currency.displayName;
        }

        function processStartLeasingTransaction(transaction) {
            transaction.formatted.amount = Money.fromCoins(transaction.amount, Currency.WAVES).formatAmount();
            transaction.formatted.asset = Currency.WAVES.displayName;
        }

        function processCancelLeasingTransaction(transaction) {
            transaction.formatted.asset = Currency.WAVES.displayName;
        }

        function processExchangeTransaction(transaction) {
            let type = `Exchange`;

            const buyOrder = transaction.order1;
            const assetId = buyOrder.assetPair.amountAsset;
            let totalFee = 0;
            if (buyOrder.senderPublicKey === applicationContext.account.keyPair.public) {
                type = `${type} Buy`;
                totalFee += transaction.buyMatcherFee;
            }

            const sellOrder = transaction.order2;
            if (sellOrder.senderPublicKey === applicationContext.account.keyPair.public) {
                type = `${type} Sell`;
                totalFee += transaction.sellMatcherFee;
            }

            transaction.formatted.type = type;
            transaction.formatted.fee = Money.fromCoins(totalFee, Currency.WAVES).formatAmount(true);

            let currency;
            if (assetId) {
                const asset = applicationContext.cache.assets[assetId];
                if (asset) {
                    currency = asset.currency;
                }
            } else {
                currency = Currency.WAVES;
            }

            if (currency) {
                transaction.formatted.asset = currency.displayName;
                transaction.formatted.amount = Money.fromCoins(transaction.amount, currency).formatAmount();
            }
        }

        function formatFee(transaction) {
            let currency = Currency.WAVES;
            const assetId = transaction.feeAsset;
            if (assetId) {
                const asset = applicationContext.cache.assets[assetId];
                if (asset) {
                    currency = asset.currency;
                }
            }

            return Money.fromCoins(transaction.fee, currency).formatAmount(true);
        }

        function getFeeAsset(transaction) {
            let currency = Currency.WAVES;
            const assetId = transaction.feeAsset;
            if (assetId) {
                const asset = applicationContext.cache.assets[assetId];
                if (asset) {
                    currency = asset.currency;
                }
            }

            return currency;
        }

        function formatTransaction(transaction) {
            // in the future currency should be a part of transaction itself
            const currentAddress = applicationContext.account.address;
            const type = transaction.sender === currentAddress ? `Outgoing` : `Incoming`;

            transaction.formatted = {
                type: `${type} ${buildTransactionType(transaction.type)}`,
                datetime: formattingService.formatTimestamp(transaction.timestamp),
                isOutgoing: transaction.sender === currentAddress,
                sender: transformAddress(transaction.sender),
                recipient: transformAddress(transaction.recipient),
                amount: `N/A`,
                fee: formatFee(transaction),
                feeAsset: getFeeAsset(transaction),
                asset: `Loading`
            };

            processTransaction(transaction);

            return transaction;
        }

        return function filterInput(input) {
            return _.map(input, formatTransaction);
        };
    }

    Transaction.$inject = [`constants.transactions`, `applicationContext`, `formattingService`];

    angular
        .module(`app.shared`)
        .filter(`transaction`, Transaction);
})();

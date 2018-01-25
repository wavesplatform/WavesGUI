(function () {
    'use strict';

    /**
     * @param {app.i18n} i18n
     * @param {app.utils} utils
     * @returns {TransactionsCsvGen}
     */
    const factory = function (i18n, utils) {

        const HEADERS = [
            { name: 'csv.date', id: 'timestamp' },
            { name: 'csv.id', id: 'id' },
            { name: 'csv.type', id: 'type' },
            { name: 'csv.transactionType', id: 'transactionType' },
            { name: 'csv.price.ticker', id: 'priceTicker' },
            { name: 'csv.price.name', id: 'priceName' },
            { name: 'csv.price.value', id: 'priceValue' },
            { name: 'csv.price.id', id: 'priceId' },
            { name: 'csv.amount.ticker', id: 'amountTicker' },
            { name: 'csv.amount.name', id: 'amountName' },
            { name: 'csv.amount.value', id: 'amountValue' },
            { name: 'csv.amount.id', id: 'amountId' },
            { name: 'csv.fee.ticker', id: 'feeTicker' },
            { name: 'csv.fee.name', id: 'feeName' },
            { name: 'csv.fee.value', id: 'feeValue' },
            { name: 'csv.fee.id', id: 'feeId' },
            { name: 'csv.sender', id: 'sender' },
            { name: 'csv.recipient', id: 'recipient' },
            { name: 'csv.attachment', id: 'attachment' },
            { name: 'csv.height', id: 'height' },
            { name: 'csv.alias', id: 'alias' },
            { name: 'csv.description', id: 'description' },
            { name: 'csv.name', id: 'name' },
            { name: 'csv.reissuable.name', id: 'reissuable' },
            { name: 'csv.precision', id: 'precision' }
        ];

        const MONEY_FIELDS = ['amount', 'fee'];
        const NS = 'app.wallet.transactions';

        class TransactionsCsvGen {

            generate(data) {
                const csv = CSV.generate({
                    header: HEADERS.map((item) => {
                        return {
                            id: item.id,
                            name: i18n.translate(item.name, NS)
                        };
                    }),
                    body: data.reduce((result, item) => result.concat(item.transactions), [])
                        .map((tx) => {
                            const clone = { ...tx };
                            MONEY_FIELDS.forEach((id) => {
                                if (clone[id]) {
                                    clone[`${id}Name`] = clone[id].asset.name;
                                    clone[`${id}Ticker`] = clone[id].asset.ticker;
                                    clone[`${id}Id`] = clone[id].asset.id;
                                    clone[`${id}Value`] = clone[id].toFormat();
                                }
                            });
                            if (clone.price) {
                                clone.priceTicker = clone.price.pair.priceAsset.ticker;
                                clone.priceName = clone.price.pair.priceAsset.name;
                                clone.priceId = clone.price.pair.priceAsset.id;
                                clone.priceValue = clone.price.getTokens()
                                    .toFormat(clone.price.pair.priceAsset.precision);
                            }
                            return clone;
                        }),
                    processors: {
                        timestamp: (date) => {
                            return date && utils.moment(date).format('DD.MM.YYYY hh:mm:ss') || date;
                        },
                        reissuable: (issue) => {
                            return issue != null && i18n.translate(`csv.reissuable.${issue}`, NS) || issue;
                        }
                    }
                });

                CSV.download(csv, 'transactions.csv');
            }

        }

        return new TransactionsCsvGen();
    };

    factory.$inject = ['i18n', 'utils'];

    angular.module('app.wallet.transactions').factory('transactionsCsvGen', factory);
})();

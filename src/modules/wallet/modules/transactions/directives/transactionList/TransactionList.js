(function () {
    'use strict';

    const SEARCH_FIELDS = [
        { name: 'sender', strict: false },
        { name: 'recipient', strict: false },
        { name: 'attachment', strict: true },
        { name: 'amount.tokens', strict: false },
        { name: 'timestamp', strict: false }
    ];

    /**
     * @param Base
     * @param {User} user
     * @param i18n
     * @param {AssetsService} assetsService
     * @param {TransactionsService} transactionsService
     * @param {Function} createPoll
     * @param {Function} createPromise
     * @param {app.utils} utils
     * @return {TransactionList}
     */
    const controller = function (Base, user, i18n, assetsService, transactionsService, createPoll, createPromise, utils) {

        class TransactionList extends Base {

            constructor() {
                super();
                /**
                 * @type {Array}
                 */
                this._transactions = null;
                /**
                 * @type {Array}
                 */
                this.transactions = null;
                /**
                 * @type {string}
                 */
                this.transactionType = null;
                /**
                 * @type {string}
                 */
                this.search = null;
                /**
                 * @type {string}
                 */
                this.mirrorId = null;
                /**
                 * @type {IAssetInfo}
                 */
                this.mirror = null;
                /**
                 * @type {boolean}
                 */
                this.hadResponse = false;

                createPromise(this, user.getSetting('baseAssetId'))
                    .then((mirrorId) => {
                        this.mirrorId = mirrorId;

                        assetsService.getAssetInfo(this.mirrorId)
                            .then((mirror) => {
                                this.mirror = mirror;

                                createPoll(this, this._getTransactions, '_transactions', 4000, { isBalance: true });
                                this.observe(['_transactions', 'transactionType', 'search'], this._onChangeFilters);
                            });
                    });

            }

            /**
             * @private
             */
            _getTransactions() {
                return transactionsService.transactions()
                    .then((list) => list.map(this._map, this))
                    .then((list) => utils.whenAll(list))
                    .then((list) => {
                        this.hadResponse = true;
                        return list;
                    });
            }

            /**
             * @param item
             * @return {Promise}
             * @private
             */
            _map(item) {
                item.type = this._getTransactionType(item);
                item.address = this._getTransactionAddress(item);

                let promise;

                switch (item.type) {
                    case 'leasing':
                        // TODO! Leasing. Author Tsigel at 07/11/2017 08:02
                        break;
                    case 'issue':
                        // TODO! Issue. Author Tsigel at 07/11/2017 08:03
                        break;
                    case 'exchange':
                        // TODO! Exchange. Author Tsigel at 07/11/2017 12:26
                        break;
                    case 'alias':
                        item.amount = item.fee;
                }

                if (item.amount) {
                    promise = assetsService.getRate(item.amount.asset.id, this.mirrorId)
                        .then((api) => {
                            item.mirrorBalance = api.exchange(item.amount.coins);
                        });
                } else {
                    if (!promise) {
                        promise = utils.when({});
                    }
                }

                return promise.then(() => item);
            }

            /**
             * @private
             */
            _onChangeFilters() {
                const filter = tsUtils.filterList(
                    this._getTypeFilter(),
                    this._getSearchFilter()
                );

                const transactions = (this._transactions || []).filter(filter);
                const hash = Object.create(null);
                const toDate = tsUtils.date('DD.MM.YYYY');

                transactions.forEach((transaction) => {
                    const date = toDate(transaction.timestamp);
                    if (!hash[date]) {
                        hash[date] = { timestamp: transaction.timestamp, transactions: [] };
                    }
                    hash[date].transactions.push(transaction);
                });

                const dates = Object.keys(hash)
                    .sort(utils.comparators.process((name) => hash[name].timestamp).desc);

                // TODO! Remove. Author Tsigel at 07/11/2017 15:24
                console.log(transactions.reduce((result, item) => {
                    if (!result[item.type]) {
                        result[item.type] = item;
                    }
                    return result;
                }, Object.create(null)));

                this.transactions = dates.map((date) => ({
                    timestamp: hash[date].timestamp,
                    date,
                    transactions: hash[date].transactions
                }));
            }

            /**
             * @returns {*}
             * @private
             */
            _getTypeFilter() {
                if (!this.transactionType || this.transactionType === 'all') {
                    return () => true;
                } else {
                    return ({ type }) => type === this.transactionType;
                }
            }

            /**
             * @return {function(*=)}
             * @private
             */
            _getSearchFilter() {
                return (transaction) => {
                    return !this.search || SEARCH_FIELDS.some((fieldData) => {
                        const field = tsUtils.get(transaction, fieldData.name);

                        if (!field) {
                            return false;
                        }

                        if (field instanceof Date) {
                            return `${field.getDate()}`.indexOf(this.search) !== -1;
                        }
                        return String(field)
                            .indexOf(this.search) !== -1;
                    });
                };
            }

            /**
             * @param {string} sender
             * @param {string} recipient
             * @return {string}
             * @private
             */
            _getTransactionType({ transactionType, sender, recipient }) {
                switch (transactionType) {
                    case 'transfer':
                        return TransactionList._getTransferType(sender, recipient);
                    case 'createAlias':
                        return 'alias';
                    default:
                        return transactionType;
                }
            }

            _getTransactionAddress({ type, sender, recipient }) {
                switch (type) {
                    case 'receive':
                    case 'issue':
                    case 'reissue':
                    case 'exchange':
                    case 'alias':
                        return sender;
                    default:
                        return recipient;
                }
            }

            /**
             * @param {string} sender
             * @param {string} recipient
             * @return {string}
             * @private
             */
            static _getTransferType(sender, recipient) {
                return sender === recipient ? 'circle' : sender === user.address ? 'sent' : 'receive';
            }

        }

        return new TransactionList();
    };

    controller.$inject = [
        'Base',
        'user',
        'i18n',
        'assetsService',
        'transactionsService',
        'createPoll',
        'createPromise',
        'utils'
    ];

    angular.module('app.wallet.transactions')
        .component('wTransactionList', {
            bindings: {
                transactionType: '<',
                search: '<'
            },
            templateUrl: '/modules/wallet/modules/transactions/directives/transactionList/transactionList.html',
            transclude: false,
            controller
        });
})();

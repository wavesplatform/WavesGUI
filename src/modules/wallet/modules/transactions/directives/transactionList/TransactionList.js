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
                /**
                 * @type {string}
                 */
                this.currentAssetId = null;

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

                switch (item.type) {
                    case 'alias':
                        item.amount = item.fee;
                        break;
                    default:
                }

                return item;
            }

            /**
             * @private
             */
            _onChangeFilters() {
                const filter = tsUtils.filterList(
                    this._getAssetFilter(),
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

                this.transactions = dates.map((date) => ({
                    timestamp: hash[date].timestamp,
                    date,
                    transactions: hash[date].transactions
                }));
            }

            _getAssetFilter() {
                if (this.currentAssetId) {
                    return ({ type, amount }) => {
                        switch (type) {
                            case 'send':
                            case 'receive':
                            case 'circular':
                                return amount.asset.id === this.currentAssetId;
                            default:
                                return false;
                        }
                    };
                } else {
                    return () => true;
                }
            }

            /**
             * @returns {*}
             * @private
             */
            _getTypeFilter() {
                if (!this.transactionType || this.transactionType === 'all') {
                    return () => true;
                } else {
                    const types = this.transactionType.split(',').map((item) => item.trim());
                    return ({ type }) => types.indexOf(type) !== -1;
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

            /**
             * @param type
             * @param sender
             * @param recipient
             * @return {*}
             * @private
             */
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
                return sender === recipient ? 'circular' : sender === user.address ? 'send' : 'receive';
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
                currentAssetId: '@',
                transactionType: '<',
                search: '<'
            },
            templateUrl: 'modules/wallet/modules/transactions/directives/transactionList/transactionList.html',
            transclude: false,
            controller
        });
})();

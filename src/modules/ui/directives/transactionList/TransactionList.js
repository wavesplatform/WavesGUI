(function () {
    'use strict';

    const TYPES = {
        SEND: 'send',
        RECEIVE: 'receive',
        CIRCULAR: 'circular',
        ISSUE: 'issue',
        REISSUE: 'reissue',
        BURN: 'burn',
        EXCHANGE_BUY: 'exchange-buy',
        EXCHANGE_SELL: 'exchange-sell',
        LEASE_IN: 'lease-in',
        LEASE_OUT: 'lease-out',
        CANCEL_LEASING: 'cancel-leasing',
        CREATE_ALIAS: 'create-alias'
    };

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
                this.assetIdList = null;
                /**
                 * @type {object}
                 */
                this.TYPES = TYPES;

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
                    .then((list) => list.map(TransactionList._map, this))
                    .then((list) => {
                        this.hadResponse = true;
                        return list;
                    });
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

            /**
             * @private
             */
            _getAssetFilter() {
                if (this.assetIdList && this.assetIdList.length) {
                    return ({ type, amount }) => {
                        switch (type) {
                            case 'send':
                            case 'receive':
                            case 'circular':
                                return this.assetIdList.indexOf(amount.asset.id) !== -1;
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
             * @param item
             * @return {Promise}
             * @private
             */
            static _map(item) {
                item.type = TransactionList._getTransactionType(item);
                return item;
            }

            /**
             * @param {object} tx
             * @param {string} tx.transactionType
             * @param {string} tx.sender
             * @param {string} tx.recipient
             * @param {object} tx.buyOrder
             * @param {object} tx.sellOrder
             * @return {string}
             * @private
             */
            static _getTransactionType(tx) {
                switch (tx.transactionType) {
                    case 'transfer':
                        return TransactionList._getTransferType(tx.sender, tx.recipient);
                    case 'exchange':
                        return TransactionList._getExchangeType(tx);
                    case 'lease':
                        return TransactionList._getLeaseType(tx.sender);
                    case 'cancelLeasing':
                        return TYPES.CANCEL_LEASING;
                    case 'createAlias':
                        return TYPES.CREATE_ALIAS;
                    case 'issue':
                        return TYPES.ISSUE;
                    case 'reissue':
                        return TYPES.REISSUE;
                    case 'burn':
                        return TYPES.BURN;
                    default:
                        throw new Error(`Unsupported transaction type ${tx.transactionType}`);
                }
            }

            /**
             * @param {string} sender
             * @param {string} recipient
             * @return {string}
             * @private
             */
            static _getTransferType(sender, recipient) {
                if (sender === recipient) {
                    return TYPES.CIRCULAR;
                } else {
                    return sender === user.address ? TYPES.SEND : TYPES.RECEIVE;
                }
            }

            /**
             * @param {string} sender
             * @return {string}
             * @private
             */
            static _getLeaseType(sender) {
                return sender === user.address ? TYPES.LEASE_OUT : TYPES.LEASE_IN;
            }

            /**
             * @param {object} tx
             * @return {string}
             * @private
             */
            static _getExchangeType(tx) {
                if (tx.buyOrder.senderPublicKey === user.publicKey) {
                    return TYPES.EXCHANGE_BUY;
                } else {
                    return TYPES.EXCHANGE_SELL;
                }
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

    angular.module('app.ui')
        .component('wTransactionList', {
            bindings: {
                assetIdList: '<',
                transactionType: '<',
                search: '<'
            },
            templateUrl: 'modules/ui/directives/transactionList/transactionList.html',
            transclude: false,
            controller
        });
})();

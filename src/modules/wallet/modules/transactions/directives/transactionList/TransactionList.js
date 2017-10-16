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
     * @return {TransactionList}
     */
    const controller = function (Base, user, i18n, assetsService, transactionsService) {

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

                user.getSetting('baseAssetId')
                    .then((mirrorId) => {
                        this.mirrorId = mirrorId;

                        assetsService.getAssetInfo(this.mirrorId)
                            .then((mirror) => {
                                this.mirror = mirror;

                                this.createPoll(this._getTransactions, '_transactions', 4000);
                                this.observe(['_transactions', 'transactionType', 'search'], this._onChangeFilters);
                            });
                    });

            }

            /**
             * @private
             */
            _getTransactions() {
                return transactionsService.transactions()
                    .then((list) => list.map(this._getRate, this));
            }

            /**
             * @param item
             * @return {Promise}
             * @private
             */
            _getRate(item) {
                assetsService.getRate(item.amount.assetId, this.mirrorId).then((api) => {
                    item.mirrorBalance = api.exchange(Number(item.amount.tokens));
                });
                assetsService.getAssetInfo(item.amount.assetId)
                    .then((asset) => {
                        item.asset = asset;
                    });
                const date = {
                    day: item.timestamp.getDate(),
                    month: i18n.translate(`date.month.${item.timestamp.getMonth()}`)
                };
                item.date = date;
                item.type = this._getTransactionType(item);
                return item;
            }

            /**
             * @private
             */
            _onChangeFilters() {
                const filter = tsUtils.filterList(
                    this._getTypeFilter(),
                    this._getSearchFilter()
                );
                this.transactions = (this._transactions || []).filter(filter);
            }

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
                        return String(field).indexOf(this.search) !== -1;
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
                    default:
                        return item.transactionType;
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

    controller.$inject = ['Base', 'user', 'i18n', 'assetsService', 'transactionsService'];

    angular.module('app.wallet.transactions').component('wTransactionList', {
        bindings: {
            transactionType: '<',
            search: '<'
        },
        templateUrl: '/modules/wallet/modules/transactions/directives/transactionList/transactionList.html',
        transclude: false,
        controller
    });
})();

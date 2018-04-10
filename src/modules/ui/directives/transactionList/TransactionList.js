(function () {
    'use strict';

    /**
     * @param Base
     * @param {User} user
     * @param i18n
     * @param {Waves} waves
     * @param {app.utils} utils
     * @return {TransactionList}
     */
    const controller = function (Base, user, i18n, waves, utils) {

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
                 * @type {boolean}
                 */
                this.pending = false;

                this.observe('_transactions', this._onChangeTransactions);
            }

            /**
             * @private
             */
            _onChangeTransactions() {
                const transactions = (this._transactions || []);
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
                    transactions: hash[date].transactions,
                    timestamp: hash[date].timestamp,
                    date
                }));
            }

        }

        return new TransactionList();
    };

    controller.$inject = [
        'Base',
        'user',
        'i18n',
        'waves',
        'utils'
    ];

    angular.module('app.ui')
        .component('wTransactionList', {
            bindings: {
                transactionDatePattern: '@',
                pending: '<',
                _transactions: '<transactions'
            },
            templateUrl: 'modules/ui/directives/transactionList/transactionList.html',
            transclude: false,
            controller
        });
})();

(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param {TransactionsCsvGen} transactionsCsvGen
     * @param {Waves} waves
     * @param {function} createPoll
     * @return {TransactionsCtrl}
     */
    const controller = function (Base, $scope, transactionsCsvGen, waves, createPoll) {

        class TransactionsCtrl extends Base {

            constructor() {
                super($scope);
                /**
                 * @type {ITransaction[]}
                 */
                this.transactions = [];
                /**
                 * @type {boolean}
                 */
                this.pending = true;
                /**
                 * @type {string}
                 */
                this.filter = null;
                /**
                 * @type {ITransaction[]}
                 * @private
                 */
                this.txList = [];

                this.syncSettings({ filter: 'wallet.transactions.filter' });

                createPoll(this, waves.node.transactions.list, this._setTxList, 4000, { isBalance: true });

                this.observe(['txList', 'filter'], this._applyTransactionList);
            }

            exportTransactions() {
                transactionsCsvGen.generate(this.transactions);
            }

            /**
             * @private
             */
            _applyTransactionList() {
                const filter = this.filter;
                const list = this.txList;
                const availableTypes = filter.split(',')
                    .map((type) => type.trim())
                    .reduce((result, type) => {
                        result[type] = true;
                        return result;
                    }, Object.create(null));

                if (filter === 'all') {
                    this.transactions = list.slice();
                } else {
                    this.transactions = list.filter(({ type }) => availableTypes[type]);
                }
            }

            /**
             * @param {ITransaction[]} transactions
             * @private
             */
            _setTxList(transactions) {
                this.pending = false;
                this.txList = transactions;
                $scope.$apply();
            }

        }

        return new TransactionsCtrl();
    };

    controller.$inject = ['Base', '$scope', 'transactionsCsvGen', 'waves', 'createPoll'];

    angular.module('app.wallet.transactions').controller('TransactionsCtrl', controller);
})();

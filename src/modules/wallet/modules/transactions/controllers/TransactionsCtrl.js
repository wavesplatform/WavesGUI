(function () {
    'use strict';

    /**
     * @param {User} user
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {TransactionsCsvGen} transactionsCsvGen
     * @param {Waves} waves
     * @param {IPollCreate} createPoll
     * @param {INotification} notification
     * @return {TransactionsCtrl}
     */
    const controller = function (user, Base, $scope, transactionsCsvGen, waves, createPoll, notification) {

        const analytics = require('@waves/event-sender');

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
                /**
                 * @type {number}
                 */
                this.limit = 100;

                this.observe(['filter'], this._sendAnalytics);

                this.syncSettings({ filter: 'wallet.transactions.filter' });

                const poll = createPoll(this, this._getTxList, this._setTxList, 4000, { isBalance: true });

                this.observe(['txList', 'filter'], this._applyTransactionList);
                this.observe('limit', () => poll.restart());
            }

            exportTransactions(maxTransactions = 10000) {
                // analytics.push('TransactionsPage', `TransactionsPage.CSV.${WavesApp.type}`, 'download');
                analytics.send({ name: 'Transactions Export Click', target: 'ui' });
                const MAX_LIMIT = 1000;

                const getSeriesTransactions = async ({ allTransactions = [], after = '' } = {}) => {
                    let transactions;
                    let downloadError = false;

                    try {
                        transactions = await waves.node.transactions.list(MAX_LIMIT, after);
                    } catch (e) {
                        downloadError = true;
                        if (!allTransactions.length) {
                            notification.error({
                                ns: 'app.wallet.transactions',
                                title: { literal: 'errors.download.title' },
                                body: { literal: 'errors.download.body' }
                            });
                            return [];
                        }

                        transactions = [];
                        notification.error({
                            ns: 'app.wallet.transactions',
                            title: { literal: 'errors.complete.title' },
                            body: { literal: 'errors.complete.body' }
                        });

                    }

                    allTransactions = allTransactions.concat(transactions.filter(el => !user.scam[el.assetId]));

                    if (transactions.length < MAX_LIMIT || allTransactions.length > maxTransactions) {
                        return { allTransactions, downloadError };
                    } else {
                        return getSeriesTransactions({
                            allTransactions,
                            after: transactions[transactions.length - 1].id
                        });
                    }
                };

                const promiseGetTransactions = getSeriesTransactions();
                promiseGetTransactions.then(({ allTransactions, downloadError }) => {
                    if (allTransactions.length) {
                        transactionsCsvGen.generate(allTransactions);
                    } else if (!downloadError) {
                        notification.info({
                            ns: 'app.wallet.transactions',
                            title: { literal: 'errors.download.title' },
                            body: { literal: 'errors.download.body' }
                        });
                    }
                });
                return promiseGetTransactions;
            }

            _getTxList() {
                return waves.node.transactions.list(this.limit);
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
                    this.transactions = list.filter(({ typeName }) => availableTypes[typeName]);
                }
            }

            /**
             * @private
             */
            _sendAnalytics() {
                let actionName;
                switch (this.filter) {
                    case 'all':
                        actionName = 'Transactions All Show';
                        break;
                    case 'send,mass-send':
                        actionName = 'Transactions Sent Show';
                        break;
                    case 'receive,mass-receive,sponsorship-fee':
                        actionName = 'Transactions Received Show';
                        break;
                    case 'exchange-buy,exchange-sell':
                        actionName = 'Transactions Exchanged Show';
                        break;
                    case 'lease-in,lease-out,cancel-leasing':
                        actionName = 'Transactions Leased Show';
                        break;
                    case 'issue,reissue,burn,sponsorship-stop,sponsorship-start':
                        actionName = 'Transactions Issued Show';
                        break;
                    default:
                        break;
                }
                analytics.send({ name: actionName, target: 'ui' });
            }

            /**
             * @param {ITransaction[]} transactions
             * @private
             */
            _setTxList(transactions) {
                this.pending = false;
                this.txList = transactions;
                $scope.$digest();
            }

        }

        return new TransactionsCtrl();
    };

    controller.$inject = ['user', 'Base', '$scope', 'transactionsCsvGen', 'waves', 'createPoll', 'notification'];

    angular.module('app.wallet.transactions').controller('TransactionsCtrl', controller);
})();

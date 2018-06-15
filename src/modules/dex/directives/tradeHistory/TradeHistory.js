/* global tsApiValidator */
(function () {
    'use strict';

    const entities = require('@waves/data-entities');
    const R = require('ramda');

    /**
     * @param {Base} Base
     * @param {$rootScope.Scope} $scope
     * @param {IPollCreate} createPoll
     * @param {User} user
     * @return {TradeHistory}
     */
    const controller = function (Base, $scope, createPoll, user) {

        const PAIR_COLUMN_DATA = {
            id: 'pair',
            valuePath: 'item.pair',
            search: true
        };

        const FEE_COLUMN_DATA = {
            id: 'fee',
            title: { literal: 'directives.tradeHistory.tableTitle.fee' },
            valuePath: 'item.userFee',
            sort: true
        };

        const HEADER_COLUMNS = [
            {
                id: 'type',
                title: { literal: 'directives.tradeHistory.tableTitle.type' },
                valuePath: 'item.exchangeType',
                sort: true
            },
            {
                id: 'time',
                title: { literal: 'directives.tradeHistory.tableTitle.date' },
                valuePath: 'item.timestamp',
                sort: true,
                sortActive: true,
                isAsc: false
            },
            {
                id: 'price',
                title: { literal: 'directives.tradeHistory.tableTitle.price' },
                valuePath: 'item.price',
                sort: true
            },
            {
                id: 'amount',
                title: { literal: 'directives.tradeHistory.tableTitle.size' },
                valuePath: 'item.amount',
                sort: true
            },
            {
                id: 'total',
                title: { literal: 'directives.tradeHistory.tableTitle.total' },
                valuePath: 'item.total',
                sort: true
            }
        ];

        class TradeHistory extends Base {

            constructor() {
                super();
                /**
                 * @type {{amount: string, price: string}}
                 * @private
                 */
                this._assetIdPair = null;
                /**
                 * @type {boolean}
                 */
                this.isMy = false;
                /**
                 * @type {Array}
                 */
                this.history = [];
                /**
                 * @type {function}
                 */
                this.remapTransactions = TradeHistory._remapTxList();
                /**
                 * @type {boolean}
                 */
                this.pending = true;

                this.headers = [];

                this.syncSettings({
                    _assetIdPair: 'dex.assetIdPair'
                });
            }

            $postLink() {
                this.headers = this.isMy ? [PAIR_COLUMN_DATA].concat(HEADER_COLUMNS, FEE_COLUMN_DATA) : HEADER_COLUMNS;
                /**
                 * @type {Poll}
                 */
                this.poll = createPoll(this, this._getTradeHistory, this._setTradeHistory, 1000, { $scope });
                this.observe('_assetIdPair', this._onChangeAssets);
            }

            $onDestroy() {
                super.$onDestroy();
                this.poll.destroy();
            }

            /**
             * @private
             */
            _onChangeAssets() {
                this.pending = true;
                this.history = [];
                this.poll.restart();
            }

            /**
             * @return {Promise<any>}
             * @private
             */
            _getTradeHistory() {
                return ds.api.transactions.getExchangeTxList(this._getTransactionsFilter())
                    .then(this.remapTransactions);
            }

            _setTradeHistory(history) {
                this.pending = false;
                this.history = history;
            }

            _getTransactionsFilter() {
                // TODO remove timestart 0
                if (this.isMy) {
                    return { sender: user.address, timeStart: 0 };
                }
                return {
                    amountAsset: this._assetIdPair.amount,
                    priceAsset: this._assetIdPair.price,
                    timeStart: 0
                };
            }

            static _remapTxList() {
                const filter = R.uniqBy(R.prop('id'));
                const map = R.map(TradeHistory._remapTx);
                return R.pipe(filter, map);
            }

            static _remapTx(tx) {
                const amount = tx => tx.amount.asset.displayName;
                const price = tx => tx.price.asset.displayName;
                const fee = (tx, order) => order.orderType === 'sell' ? tx.sellMatcherFee : tx.buyMatcherFee;
                const pair = `${amount(tx)} / ${price(tx)}`;
                const emptyFee = new entities.Money(0, tx.fee.asset);
                const userFee = [tx.order1, tx.order2]
                    .filter((order) => order.sender === user.address)
                    .reduce((acc, order) => acc.add(fee(tx, order)), emptyFee);

                return { ...tx, pair, userFee };
            }

        }

        return new TradeHistory();
    };

    controller.$inject = ['Base', '$scope', 'createPoll', 'user'];

    angular.module('app.dex')
        .component('wDexTradeHistory', {
            bindings: {
                isMy: '<'
            },
            templateUrl: 'modules/dex/directives/tradeHistory/tradeHistory.html',
            controller
        });
})();

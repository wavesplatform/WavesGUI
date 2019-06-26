/* global tsApiValidator */
(function () {
    'use strict';

    const entities = require('@waves/data-entities');
    const { propEq, uniqBy, map, pipe, prop } = require('ramda');

    /**
     * @param {Base} Base
     * @param {$rootScope.Scope} $scope
     * @param {IPollCreate} createPoll
     * @param {User} user
     * @param {utils} utils
     * @return {TradeHistory}
     */
    const controller = function (Base, $scope, createPoll, user, utils) {

        const PAIR_COLUMN_DATA = {
            id: 'pair',
            valuePath: 'item.pair',
            search: true,
            placeholder: 'directives.filter'
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

            /**
             * @private
             */
            userList = [];

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
                 * @type {IExchangeTransaction[]}
                 */
                this.history = [];
                /**
                 * @type {function(tx: IExchangeTransaction[], [index]: number): boolean}
                 */
                this.remapTransactions = TradeHistory._remapTxList();
                /**
                 * @type {boolean}
                 */
                this.pending = true;
                /**
                 * @type {boolean}
                 */
                this.isDemo = false;

                this.headers = [];

                this.syncSettings({
                    _assetIdPair: 'dex.assetIdPair'
                });

                user.getFilteredUserList().then(list => {
                    this.userList = list;
                });
            }

            $postLink() {
                this.headers = this.isMy ? [PAIR_COLUMN_DATA].concat(HEADER_COLUMNS, FEE_COLUMN_DATA) : HEADER_COLUMNS;
                /**
                 * @type {boolean}
                 */
                this.isDemo = this.isMy && !user.address;
                this._initializePoll();
                this.observe('_assetIdPair', this._onChangeAssets);
            }

            /**
             * @param {IExchange} tx
             * @return boolean
             */
            isSelected(tx) {
                return this._assetIdPair.amount === tx.amount.asset.id &&
                    this._assetIdPair.price === tx.price.asset.id;
            }

            /**
             * @param {IExchange} tx
             */
            setPair(tx) {
                const isLocked = this.isLockedPair(tx);
                if (isLocked) {
                    return null;
                }
                user.setSetting('dex.assetIdPair', {
                    amount: tx.amount.asset.id,
                    price: tx.price.asset.id
                });
            }

            /**
             * @param tx
             * @public
             */
            isLockedPair(tx) {
                return utils.isLockedInDex(tx.amount.asset.id, tx.price.asset.id);
            }

            /**
             * @private
             */
            _initializePoll() {
                if (this.isMy && this.isDemo) {
                    return null;
                }

                /**
                 * @type {Poll}
                 */
                this.poll = createPoll(this, this._getTradeHistory, this._setTradeHistory, 1000);
                this.poll.ready.then(() => {
                    this.pending = false;
                });
            }

            /**
             * @private
             */
            _onChangeAssets() {
                if (!this.isMy) {
                    this.pending = true;
                    this.history = [];
                    this.poll.restart().then(() => {
                        this.pending = false;
                    });
                }
            }

            /**
             * @return {Promise<any>}
             * @private
             */
            _getTradeHistory() {
                return ds.api.transactions.getExchangeTxList(this._getTransactionsFilter())
                    .then(this.remapTransactions);
            }

            /**
             * @param {IExchangeTransaction[]} history
             * @private
             */
            _setTradeHistory(history) {
                const isEqual = this.history.length === history.length &&
                    this.history.every((item, i) => propEq('id', item, this.history[i]));

                if (isEqual) {
                    return null;
                }

                this.history = history;
                $scope.$apply();
            }

            /**
             * @return {*}
             * @private
             */
            _getTransactionsFilter() {
                if (this.isMy) {
                    return { sender: user.address };
                }
                return {
                    amountAsset: this._assetIdPair.amount,
                    priceAsset: this._assetIdPair.price
                };
            }

            /**
             * @return {function(tx: IExchangeTransaction[], [index]: number): boolean}
             * @private
             */
            static _remapTxList() {
                const filter = uniqBy(prop('id'));
                const mapFunc = map(TradeHistory._remapTx);
                return pipe(filter, mapFunc);
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

    controller.$inject = ['Base', '$scope', 'createPoll', 'user', 'utils'];

    angular.module('app.dex')
        .component('wDexTradeHistory', {
            bindings: {
                isMy: '<'
            },
            templateUrl: 'modules/dex/directives/tradeHistory/tradeHistory.html',
            controller
        });
})();

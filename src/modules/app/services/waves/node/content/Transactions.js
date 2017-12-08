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

    /**
     * @param {User} user
     * @param {app.utils} utils
     * @return {Transactions}
     */
    const factory = function (user, utils) {

        class Transactions {

            constructor() {
                this.TYPES = TYPES;
            }

            /**
             * Get transaction info
             * @param {string} id Transaction id
             * @return {Promise<ITransaction>}
             */
            get(id) {
                return Waves.API.Node.v2.transactions.get(id)
                    .then(this._pipeTransaction(false));
            }

            /**
             * Get transaction info from utx
             * @param {string} id Transaction id
             * @return {Promise<ITransaction>}
             */
            getUtx(id) {
                return Waves.API.Node.v2.transactions.utxGet(id)
                    .then(this._pipeTransaction(true));
            }

            /**
             * Get transaction info
             * @param {string} id Transaction id
             * @return {Promise<ITransaction>}
             */
            getAlways(id) {
                return this.get(id)
                    .catch(() => this.getUtx(id));
            }

            /**
             * Get transactions list by user
             * @return {Promise<ITransaction[]>}
             */
            list() {
                return Waves.API.Node.v2.addresses.transactions(user.address)
                    .then((list) => list && list.map(this._pipeTransaction(false))) || [];
            }

            /**
             * Get transactions list by user from utx
             * @return {Promise<ITransaction[]>}
             */
            listUtx() {
                return Waves.API.Node.v1.transactions.utxGetList()
                    .then((list) => list.filter(Transactions._filterUtxTransactions))
                    .then((list) => list.map(Transactions._mapV1UtxTransactions))
                    .then((list) => Promise.all(list));
            }

            /**
             * Get transactions list by user
             * @return {Promise<ITransaction[]>}
             */
            listAlways() {
                return utils.whenAll([
                    this.listUtx(),
                    this.list()
                ])
                    .then(([utxTxList, txList]) => {
                        return utxTxList.map(this._pipeTransaction(true))
                            .concat(txList.map(this._pipeTransaction(false)));
                    });
            }

            /**
             * Get size of utx transactions list
             * @return {Promise<number>}
             */
            utxSize() {
                Waves.API.Node.v1.transactions.utxGetList(user.address)
                    .then((list) => list.length);
            }

            _pipeTransaction(isUTX) {
                return (tx) => {
                    tx.timestamp = new Date(tx.timestamp);
                    tx.isUTX = isUTX;
                    tx.type = Transactions._getTransactionType(tx);
                    tx.templateType = Transactions._getTemplateType(tx);
                    tx.shownAddress = Transactions._getTransactionAddress(tx);
                    return tx;
                };
            }

            static _filterUtxTransactions({ sender }) {
                return sender === user.address;
            }

            static _mapV1UtxTransactions(tx) {
                const wavesId = WavesApp.defaultAssets.WAVES;
                const promiseList = [
                    Waves.Money.fromCoins(String(tx.fee), tx.feeAsset || wavesId)
                ];

                if (tx.type === Waves.constants.TRANSFER_TX) {
                    promiseList.push(Waves.Money.fromCoins(String(tx.amount), tx.assetId || wavesId));
                }

                return Promise.all(promiseList)
                    .then(([fee, amount]) => ({ ...tx, fee, amount }));
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
                        return Transactions._getTransferType(tx);
                    case 'exchange':
                        return Transactions._getExchangeType(tx);
                    case 'lease':
                        return Transactions._getLeaseType(tx);
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
            static _getTransferType({ sender, recipient }) {
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
            static _getLeaseType({ sender }) {
                return sender === user.address ? TYPES.LEASE_OUT : TYPES.LEASE_IN;
            }

            /**
             * @param {object} tx
             * @return {string}
             * @private
             */
            static _getExchangeType({ buyOrder }) {
                if (buyOrder.senderPublicKey === user.publicKey) {
                    return TYPES.EXCHANGE_BUY;
                } else {
                    return TYPES.EXCHANGE_SELL;
                }
            }

            /**
             * @param txType
             * @return {*}
             * @private
             */
            static _getTemplateType({ type }) {
                switch (type) {
                    case TYPES.SEND:
                    case TYPES.RECEIVE:
                    case TYPES.CIRCULAR:
                        return 'transfer';
                    case TYPES.ISSUE:
                    case TYPES.REISSUE:
                    case TYPES.BURN:
                        return 'tokens';
                    case TYPES.LEASE_IN:
                    case TYPES.LEASE_OUT:
                        return 'lease';
                    case TYPES.EXCHANGE_BUY:
                    case TYPES.EXCHANGE_SELL:
                        return 'exchange';
                    default:
                        return type;
                }
            }

            /**
             * @param type
             * @param sender
             * @param recipient
             * @return {*}
             * @private
             */
            static _getTransactionAddress({ type, sender, recipient }) {
                switch (type) {
                    // TODO : clear this list as there is no need for address in some getList
                    case TYPES.RECEIVE:
                    case TYPES.ISSUE:
                    case TYPES.REISSUE:
                    case TYPES.LEASE_OUT:
                    case TYPES.CREATE_ALIAS:
                        return sender;
                    default:
                        return recipient;
                }
            }

        }

        return utils.bind(new Transactions());
    };

    factory.$inject = ['user', 'utils'];

    angular.module('app')
        .factory('transactions', factory);
})();

/**
 * @typedef {Object} ITransaction
 * @property {string} type
 * @property {string} transactionType
 * @property {number} height
 * @property {boolean} isUTX
 */

(function () {
    'use strict';

    /**
     * @param {User} user
     * @param {app.utils} utils
     * @param {Aliases} aliases
     * @param {app.utils.decorators} decorators
     * @param {BaseNodeComponent} BaseNodeComponent
     * @return {Transactions}
     */
    const factory = function (user, utils, aliases, decorators, BaseNodeComponent) {

        const HOST = location.host;
        const TYPES = WavesApp.TRANSACTION_TYPES.EXTENDED;

        class Transactions extends BaseNodeComponent {

            constructor() {
                super();

                this.TYPES = TYPES;

                Promise.all([
                    Waves.Money.fromCoins('0', WavesApp.defaultAssets.WAVES)
                ]).then(([waves]) => {
                    this.EMPTY_MONEY = {
                        [WavesApp.defaultAssets.WAVES]: waves
                    };
                });
            }

            /**
             * Get transaction info
             * @param {string} id Transaction id
             * @return {Promise<ITransaction>}
             */
            get(id) {
                return fetch(`${this.network.node}/transactions/info/${id}?h=${HOST}`)
                    .then(Waves.tools.siftTransaction)
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
                    .catch(() => this.getUtx(id))
                    // Get a transaction even on the edge of its move from UTX to blockchain.
                    .catch(() => this.get(id));
            }

            /**
             * Get transactions list by user
             * @param {number} [limit]
             * @return {Promise<ITransaction[]>}
             */
            @decorators.cachable(1)
            list(limit = 1000) {
                return fetch(`${this.network.node}/transactions/address/${user.address}/limit/${limit}`)
                    .then(([txList = []]) => Promise.all(txList.map(Waves.tools.siftTransaction)))
                    .then((list) => list.map(this._pipeTransaction(false)));
            }

            /**
             * @return {Promise<ITransaction[]>}
             */
            @decorators.cachable(120)
            getActiveLeasingTx() {
                return fetch(`${this.network.node}/leasing/active/${user.address}`)
                    .then((txList = []) => Promise.all(txList.map(Waves.tools.siftTransaction)))
                    .then((list) => list.map(this._pipeTransaction(false)));
            }

            /**
             * Get transactions list by user from utx
             * @return {Promise<ITransaction[]>}
             */
            listUtx() {
                const address = user.address;

                return fetch(`${this.network.node}/transactions/unconfirmed`)
                    .then((list) => list.filter((item) => item.recipient === address || item.sender === address))
                    .then((list) => list.map(Waves.tools.siftTransaction))
                    .then((list) => Promise.all(list))
                    .then((list = []) => list.map(this._pipeTransaction(true)));
            }

            /**
             * Get transactions list by user
             * @return {Promise<ITransaction[]>}
             */
            listAlways() {
                return utils.whenAll([
                    this.listUtx(),
                    this.list()
                ]).then(([utxTxList, txList]) => utxTxList.concat(txList));
            }

            createTransaction(transactionType, txData) {

                const tx = {
                    transactionType,
                    sender: user.address,
                    timestamp: Date.now(),
                    ...txData
                };

                if (transactionType === WavesApp.TRANSACTION_TYPES.NODE.MASS_TRANSFER) {
                    tx.totalAmount = tx.totalAmount || tx.transfers.map(({ amount }) => amount)
                        .reduce((result, item) => result.add(item));
                }

                return this._pipeTransaction(false)(tx);
            }

            /**
             * @param {boolean} isUTX
             * @return {function(*=)}
             * @private
             */
            _pipeTransaction(isUTX) {
                return (tx) => {

                    if (tx.type && tx.originalTx.type === 2) {
                        const originalTx = tx.originalTx;
                        delete tx.originalTx;
                        Object.assign(tx, this._remapOldSendTransaction(originalTx));
                    }

                    tx.timestamp = new Date(tx.timestamp);
                    tx.isUTX = isUTX;
                    tx.type = Transactions._getTransactionType(tx);
                    tx.templateType = Transactions._getTemplateType(tx);
                    tx.shownAddress = Transactions._getTransactionAddress(tx);

                    const list = aliases.getAliasList();

                    switch (tx.type) {
                        case TYPES.BURN:
                        case TYPES.REISSUE:
                            tx.name = tx.name || tx.quantity.asset.name;
                            break;
                        case TYPES.ISSUE:
                            tx.quantityStr = tx.quantity.toFormat(tx.precision);
                            break;
                        case TYPES.MASS_SEND:
                            tx.numberOfRecipients = tx.transfers.length;
                            tx.amount = tx.totalAmount;
                            break;
                        case TYPES.MASS_RECEIVE:
                            tx.amount = tx.transfers
                                .filter(({ recipient }) => recipient === user.address || list.indexOf(recipient) !== -1)
                                .map(({ amount }) => amount)
                                .reduce((acc, val) => acc.add(val));
                            break;
                        default:
                            break;
                    }

                    return tx;
                };
            }

            _remapOldSendTransaction(tx) {
                return {
                    ...tx,
                    transactionType: 'transfer',
                    amount: this.EMPTY_MONEY[WavesApp.defaultAssets.WAVES].cloneWithCoins(String(tx.amount)),
                    fee: this.EMPTY_MONEY[WavesApp.defaultAssets.WAVES].cloneWithCoins(String(tx.fee))
                };
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
                    case Waves.constants.TRANSFER_TX_NAME:
                        return Transactions._getTransferType(tx);
                    case Waves.constants.MASS_TRANSFER_TX_NAME:
                        return Transactions._getMassTransferType(tx.sender);
                    case Waves.constants.EXCHANGE_TX_NAME:
                        return Transactions._getExchangeType(tx);
                    case Waves.constants.LEASE_TX_NAME:
                        return Transactions._getLeaseType(tx);
                    case Waves.constants.CANCEL_LEASING_TX_NAME:
                        return TYPES.CANCEL_LEASING;
                    case Waves.constants.CREATE_ALIAS_TX_NAME:
                        return TYPES.CREATE_ALIAS;
                    case Waves.constants.ISSUE_TX_NAME:
                        return TYPES.ISSUE;
                    case Waves.constants.REISSUE_TX_NAME:
                        return TYPES.REISSUE;
                    case Waves.constants.BURN_TX_NAME:
                        return TYPES.BURN;
                    default:
                        return TYPES.UNKNOWN;
                }
            }

            /**
             * @param {string} sender
             * @param {string} recipient
             * @return {string}
             * @private
             */
            static _getTransferType({ sender, recipient }) {
                const aliasList = aliases.getAliasList();
                if (sender === recipient || (sender === user.address && aliasList.indexOf(recipient) !== -1)) {
                    return TYPES.CIRCULAR;
                } else {
                    return sender === user.address ? TYPES.SEND : TYPES.RECEIVE;
                }
            }

            static _getMassTransferType(sender) {
                return sender === user.address ? TYPES.MASS_SEND : TYPES.MASS_RECEIVE;
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
                    case TYPES.MASS_SEND:
                    case TYPES.MASS_RECEIVE:
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
                    case TYPES.UNKNOWN:
                        return 'unknown';
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
                    case TYPES.MASS_RECEIVE:
                    case TYPES.ISSUE:
                    case TYPES.REISSUE:
                    case TYPES.LEASE_IN:
                    case TYPES.CREATE_ALIAS:
                        return sender;
                    default:
                        return recipient;
                }
            }

        }

        return utils.bind(new Transactions());
    };

    factory.$inject = ['user', 'utils', 'aliases', 'decorators', 'BaseNodeComponent'];

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

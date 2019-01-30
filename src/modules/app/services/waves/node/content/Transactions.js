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

        const tsUtils = require('ts-utils');
        const R = require('ramda');
        const { SIGN_TYPE } = require('@waves/signature-adapter');
        const ds = require('data-service');

        const TYPES = WavesApp.TRANSACTION_TYPES.EXTENDED;

        class Transactions extends BaseNodeComponent {

            constructor() {
                super();

                this.TYPES = TYPES;
            }

            /**
             * Get transaction info
             * @param {string} id Transaction id
             * @return {Promise<ITransaction>}
             */
            get(id) {
                return ds.api.transactions.get(id)
                    .then(this._pipeTransaction());
            }

            /**
             * Get transaction info from utx
             * @param {string} id Transaction id
             * @return {Promise<ITransaction>}
             */
            getUtx(id) {
                return ds.api.transactions.getUTX(id)
                    .then(this._pipeTransaction());
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
                return ds.api.transactions.list(user.address, limit)
                    .then(list => list.map(this._pipeTransaction()));
            }

            /**
             * @return {Promise<ITransaction[]>}
             */
            @decorators.cachable(120)
            getActiveLeasingTx() {
                return ds.fetch(`${this.node}/leasing/active/${user.address}`)
                    .then(R.uniqBy(R.prop('id')))
                    .then(list => ds.api.transactions.parseTx(list, false))
                    .then(list => list.map(this._pipeTransaction()));
            }

            /**
             * Get transactions list by user from utx
             * @return {Promise<ITransaction[]>}
             */
            listUtx() {
                return ds.api.transactions.listUTX(user.address)
                    .then((list) => list.map(this._pipeTransaction()));
            }

            /**
             * Get transactions list by user
             * @return {Promise<ITransaction[]>}
             */
            listAlways() {
                return utils.whenAll([this.listUtx(), this.list()])
                    .then(([utxTxList, txList]) => utxTxList.concat(txList));
            }

            createTransaction(txData) {

                const tx = {
                    sender: user.address,
                    timestamp: Date.now(),
                    ...txData
                };

                if (tx.type === SIGN_TYPE.MASS_TRANSFER) {
                    tx.totalAmount = tx.totalAmount || tx.transfers.map(({ amount }) => amount)
                        .reduce((result, item) => result.add(item));
                }

                return this._pipeTransaction(false)(tx);
            }

            /**
             * @return {function(*=)}
             * @private
             */
            _pipeTransaction() {
                return (tx) => {

                    tx.timestamp = new Date(tx.timestamp);
                    tx.typeName = utils.getTransactionTypeName(tx);
                    tx.templateType = Transactions._getTemplateType(tx);
                    tx.shownAddress = Transactions._getTransactionAddress(tx);

                    const list = aliases.getAliasList();

                    switch (tx.typeName) {
                        case TYPES.BURN:
                        case TYPES.REISSUE:
                            tx.name = tx.name ||
                                tsUtils.get(tx, 'quantity.asset.name') ||
                                tsUtils.get(tx, 'amount.asset.name');
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
                                .reduce((acc, val) => acc.add(val), tx.totalAmount.cloneWithTokens(0));
                            break;
                        default:
                            break;
                    }

                    return tx;
                };
            }

            static _getTypeByName(txTypeName) {
                switch (txTypeName) {
                    case WavesApp.TRANSACTION_TYPES.NODE.TRANSFER:
                        return 4;
                    case WavesApp.TRANSACTION_TYPES.NODE.MASS_TRANSFER:
                        return 11;
                    case WavesApp.TRANSACTION_TYPES.NODE.LEASE:
                        return 8;
                    case WavesApp.TRANSACTION_TYPES.NODE.CANCEL_LEASING:
                        return 9;
                    case WavesApp.TRANSACTION_TYPES.NODE.ISSUE:
                        return 3;
                    case WavesApp.TRANSACTION_TYPES.NODE.REISSUE:
                        return 5;
                    case WavesApp.TRANSACTION_TYPES.NODE.BURN:
                        return 6;
                    case WavesApp.TRANSACTION_TYPES.NODE.CREATE_ALIAS:
                        return 10;
                    case WavesApp.TRANSACTION_TYPES.NODE.DATA:
                        return 12;
                    case WavesApp.TRANSACTION_TYPES.NODE.SET_SCRIPT:
                        return 13;
                    case WavesApp.TRANSACTION_TYPES.NODE.SPONSORSHIP:
                        return 14;
                    default:
                        throw new Error('Wrong tx name!');
                }
            }

            /**
             * @param txType
             * @return {*}
             * @private
             */
            static _getTemplateType({ typeName }) {
                switch (typeName) {
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
                    case TYPES.DATA:
                        return 'data';
                    case TYPES.SPONSORSHIP_START:
                    case TYPES.SPONSORSHIP_STOP:
                        return 'sponsorship';
                    case TYPES.SPONSORSHIP_FEE:
                        return 'sponsorship_fee';
                    case TYPES.UNKNOWN:
                        return 'unknown';
                    default:
                        return typeName;
                }
            }

            /**
             * @param type
             * @param sender
             * @param recipient
             * @return {*}
             * @private
             */
            static _getTransactionAddress({ typeName, sender, recipient }) {
                switch (typeName) {
                    // TODO : clear this list as there is no need for address in some getList
                    case TYPES.RECEIVE:
                    case TYPES.MASS_RECEIVE:
                    case TYPES.ISSUE:
                    case TYPES.REISSUE:
                    case TYPES.LEASE_IN:
                    case TYPES.CREATE_ALIAS:
                    case TYPES.SPONSORSHIP_FEE:
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

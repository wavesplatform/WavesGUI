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
     * @param {app.utils.apiWorker} apiWorker
     * @param {app.utils.decorators} decorators
     * @param {User} user
     * @param {app.utils} utils
     * @return {TransactionsService}
     */
    const factory = function (apiWorker, decorators, user, utils) {

        class TransactionsService {

            constructor() {
                this.TYPES = TYPES;
            }

            get(id) {
                return this._getTransaction(id);
            }

            getList() {
                return user.onLogin().then(() => {
                    return this._getTransactions(user.address);
                });
            }

            /**
             * @param {string} id
             * @private
             */
            @decorators.cachable(1440) // TODO : make it 0 when cachable decorator is limiting its storage size
            _getTransaction(id) {
                return apiWorker.process((Waves, id) => {
                    return Waves.API.Node.v2.transactions.get(id);
                }, id).then(TransactionsService._processTransaction);
            }

            /**
             * @param {string} address
             * @private
             */
            @decorators.cachable(2)
            _getTransactions(address) {
                return apiWorker.process((Waves, address) => {
                    return Waves.API.Node.v2.addresses.transactions(address);
                }, address).then((list) => {
                    return list.map(TransactionsService._processTransaction);
                });
            }

            static _processTransaction(tx) {
                tx.timestamp = new Date(tx.timestamp);
                tx.type = TransactionsService._getTransactionType(tx);
                tx.templateType = TransactionsService._getTemplateType(tx);
                tx.shownAddress = TransactionsService._getTransactionAddress(tx);
                return tx;
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
                        return TransactionsService._getTransferType(tx);
                    case 'exchange':
                        return TransactionsService._getExchangeType(tx);
                    case 'lease':
                        return TransactionsService._getLeaseType(tx);
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

        return utils.bind(new TransactionsService());
    };

    factory.$inject = ['apiWorker', 'decorators', 'user', 'utils'];

    angular.module('app').factory('transactionsService', factory);
})();

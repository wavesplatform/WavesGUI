(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @param {app.utils} utils
     * @param {EventManager} eventManager
     * @param {User} user
     * @return {BaseNodeComponent}
     */
    const factory = function (Base, utils, eventManager, user) {

        const TYPES = WavesApp.TRANSACTION_TYPES.NODE;

        class BaseNodeComponent extends Base {

            get matcher() {
                return user.getSetting('network.matcher');
            }

            get node() {
                return user.getSetting('network.node');
            }

            /**
             * Get list of available fee for transaction
             * @param {string} transactionType
             * @param {*} [tx]
             * @return {Promise<Money[]>}
             * @protected
             */
            _feeList({ type, tx }) {
                switch (type) {
                    case TYPES.TRANSFER:
                    case TYPES.BURN:
                    case TYPES.CREATE_ALIAS:
                    case TYPES.LEASE:
                    case TYPES.CANCEL_LEASING:
                        return Promise.all([
                            ds.moneyFromTokens('0.001', WavesApp.defaultAssets.WAVES)
                        ]);
                    case TYPES.MASS_TRANSFER:
                        return Promise.all([
                            ds.moneyFromTokens('0', WavesApp.defaultAssets.WAVES).then((money) => {
                                const len = tx && tx.transfers && tx.transfers.length || 0;
                                const transfer = new BigNumber('0.001');
                                const massTransfer = new BigNumber('0.001').div(2);
                                return money.cloneWithTokens(transfer.plus(massTransfer.times(len)));
                            })
                        ]);
                    case TYPES.ISSUE:
                    case TYPES.REISSUE:
                        return utils.whenAll([
                            ds.moneyFromTokens('1', WavesApp.defaultAssets.WAVES)
                        ]);
                    default:
                        throw new Error(`Wrong transaction type! ${type}`);
                }
            }

            /**
             * @param {string} type
             * @param {*} tx
             * @param {Money} [fee]
             * @return {Promise<Money>}
             */
            getFee({ type, tx, fee }) {
                return this._feeList({ type, tx })
                    .then((list) => {
                        if (fee) {
                            const hash = utils.toHash(list, 'asset.id');
                            if (hash[fee.asset.id] && hash[fee.asset.id].getTokens().lte(fee.getTokens())) {
                                return fee;
                            } else {
                                throw new Error('Wrong fee!');
                            }
                        } else {
                            return list[0];
                        }
                    });
            }

            /**
             * Method for create transaction event for event manager
             * @param {Money[]} moneyList
             * @protected
             */
            _pipeTransaction(moneyList) {
                return (transaction) => {
                    eventManager.addTx(transaction, moneyList);
                    return transaction;
                };
            }

        }

        return BaseNodeComponent;
    };

    factory.$inject = ['Base', 'utils', 'eventManager', 'user'];

    angular.module('app')
        .factory('BaseNodeComponent', factory);
})();

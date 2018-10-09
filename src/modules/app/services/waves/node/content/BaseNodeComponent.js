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
        const ds = require('data-service');
        const { Money } = require('@waves/data-entities');
        const { head } = require('ramda');

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
                return Promise.all([
                    ds.api.assets.get(WavesApp.defaultAssets.WAVES),
                    user.onLogin()
                ]).then(head).then(waves => {
                    const getFee = tokens => user.extraFee.add(Money.fromTokens(tokens, waves));

                    const transfer = () => {
                        const feeList = ds.utils.getTransferFeeList();
                        const fee = Money.fromTokens(0.001, waves).add(user.extraFee);
                        const assets = feeList.map(item => {
                            const count = fee.getTokens().div(0.001);
                            return item.cloneWithTokens(item.getTokens().times(count));
                        });

                        return [fee, ...assets];
                    };

                    const getMassTransferFee = () => {
                        const len = tx && tx.transfers && tx.transfers.length || 0;
                        const factor = !(len % 2) ? len : len + 1;
                        const transfer = new BigNumber('0.001');
                        const massTransfer = new BigNumber('0.001').div(2);
                        const fee = transfer.plus(massTransfer.times(factor));
                        return getFee(fee);
                    };

                    switch (type) {
                        case TYPES.TRANSFER:
                            return transfer();
                        case TYPES.BURN:
                        case TYPES.CREATE_ALIAS:
                        case TYPES.LEASE:
                        case TYPES.CANCEL_LEASING:
                        case TYPES.SET_SCRIPT:
                            return Promise.all([
                                getFee('0.001')
                            ]);
                        case TYPES.MASS_TRANSFER:
                            return Promise.all([
                                getMassTransferFee()
                            ]);
                        case TYPES.SPONSORSHIP:
                        case TYPES.ISSUE:
                        case TYPES.REISSUE:
                            return Promise.all([
                                getFee('1')
                            ]);
                        default:
                            throw new Error(`Wrong transaction type! ${type}`);
                    }
                });
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
             * @param {string} type
             * @param {*} [tx]
             * @return {Promise<Money[]>}
             */
            getFeeList({ type, tx }) {
                return this._feeList({ type, tx });
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

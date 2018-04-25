(function () {
    'use strict';

    /**
     * @param {BaseNodeComponent} BaseNodeComponent
     * @param {Aliases} aliases
     * @param {Transactions} transactions
     * @param {Assets} assets
     * @param {User} user
     * @param {app.utils} utils
     * @return {Node}
     */
    const factory = function (BaseNodeComponent, aliases, transactions, assets, user, utils) {

        class Node extends BaseNodeComponent {

            constructor() {
                super();
                /**
                 * @type {Aliases}
                 */
                this.aliases = aliases;
                /**
                 * @type {Assets}
                 */
                this.assets = assets;
                /**
                 * @type {Transactions}
                 */
                this.transactions = transactions;
            }

            isValidAddress(address) {
                try {
                    return Waves.crypto.isValidAddress(address);
                } catch (e) {
                    return false;
                }
            }

            /**
             * @return {Promise<Number>}
             */
            height() {
                return fetch(`${this.network.node}/blocks/height`)
                    .then((res) => res.height);
            }

            /**
             * Leasing transaction
             * @param {string} recipient
             * @param {Money} amount
             * @param {Money} [fee]
             * @param {string} keyPair
             * @return {Promise.<TResult>}
             */
            lease({ recipient, amount, fee, keyPair }) {
                return this.getFee({ type: WavesApp.TRANSACTION_TYPES.NODE.LEASE, fee })
                    .then((fee) => {
                        return Waves.API.Node.v1.leasing.lease({
                            amount: amount.toCoins(),
                            fee: fee.toCoins(),
                            recipient
                        }, keyPair)
                            .then(this._pipeTransaction([amount, fee]));
                    });
            }

            /**
             * Cancel leasing
             * @param {string} transactionId
             * @param {string} keyPair
             * @param {Money} [fee]
             * @return {Promise<ITransaction>}
             */
            cancelLeasing({ transactionId, keyPair, fee }) {
                return this.getFee({ type: WavesApp.TRANSACTION_TYPES.NODE.CANCEL_LEASING, fee })
                    .then((fee) => {
                        return Waves.API.Node.v1.leasing.cancelLeasing({
                            fee: fee.toCoins(),
                            transactionId
                        }, keyPair)
                            .then(this._pipeTransaction([fee]));
                    });
            }

        }

        return utils.bind(new Node());
    };

    factory.$inject = ['BaseNodeComponent', 'aliases', 'transactions', 'assets', 'user', 'utils'];

    angular.module('app')
        .factory('node', factory);
})();

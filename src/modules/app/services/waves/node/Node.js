(function () {
    'use strict';

    /**
     * @param {Aliases} aliases
     * @param {Transactions} transactions
     * @param {Assets} assets
     * @param {User} user
     * @param {app.utils} utils
     * @param {EventManager} eventManager
     * @return {Node}
     */
    const factory = function (BaseNodeComponent, aliases, transactions, assets, user, utils, eventManager) {

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

            fee(transactionType) {
                return this._feeList(transactionType);
            }

            get() {
                return Waves.API.Node.v2.addresses.get(user.address)
                    .then(({ wavesBalance }) => {

                        const available = eventManager.updateBalance(wavesBalance.available);

                        if (available.getTokens().lt(0)) {
                            return Waves.Money.fromTokens('0', available.asset.id).then((available) => {
                                return {
                                    leasedOut: wavesBalance.leasedOut,
                                    leasedIn: wavesBalance.leasedIn,
                                    available
                                };
                            });
                        } else {
                            return {
                                leasedOut: wavesBalance.leasedOut,
                                leasedIn: wavesBalance.leasedIn,
                                available: eventManager.updateBalance(wavesBalance.available)
                            };
                        }
                    });
            }

            /**
             * @return {Promise<Number>}
             */
            height() {
                return Waves.API.Node.v1.blocks.height()
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
                return this.getFee('lease', fee)
                    .then((fee) => {
                        return Waves.API.Node.v1.leasing.lease({
                            amount: amount.toCoins(),
                            fee: fee.toCoins(),
                            recipient
                        }, keyPair)
                            .then(this._pipeTransaction([fee]));
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
                return this.getFee('cancelLeasing', fee)
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

    factory.$inject = ['BaseNodeComponent', 'aliases', 'transactions', 'assets', 'user', 'utils', 'eventManager'];

    angular.module('app')
        .factory('node', factory);
})();

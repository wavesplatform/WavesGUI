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
                    return ds.isValidAddress(address);
                } catch (e) {
                    return false;
                }
            }

            /**
             * @return {Promise<Number>}
             */
            height() {
                return ds.fetch(`${this.node}/blocks/height`)
                    .then((res) => res.height);
            }

        }

        return utils.bind(new Node());
    };

    factory.$inject = ['BaseNodeComponent', 'aliases', 'transactions', 'assets', 'user', 'utils'];

    angular.module('app')
        .factory('node', factory);
})();

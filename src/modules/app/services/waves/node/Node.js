(function () {
    'use strict';

    /**
     * @param aliases
     * @param transactions
     * @param assets
     * @param {app.utils} utils
     * @return {Node}
     */
    const factory = function (aliases, transactions, assets, utils) {

        class Node {

            constructor() {
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

            height() {
                return Waves.API.Node.v1.blocks.height().then((res) => res.height);
            }

            lease() {

            }

            cancelLieasing() {

            }
        }

        return new Node();
    };

    factory.$inject = ['aliases', 'transactions', 'assets', 'utils'];

    angular.module('app').factory('node', factory);
})();

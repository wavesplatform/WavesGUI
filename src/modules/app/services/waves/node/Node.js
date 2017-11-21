(function () {
    'use strict';

    const factory = function (aliases, transactions, assets) {

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

            lease() {

            }

            cancelLieasing() {

            }
        }

        return new Node();
    };

    factory.$inject = ['aliases', 'transactions', 'assets'];

    angular.module('app').factory('node', factory);
})();

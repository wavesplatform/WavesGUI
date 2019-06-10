(function () {
    'use strict';

    /**
     * @param {BaseNodeComponent} BaseNodeComponent
     * @param {Aliases} aliases
     * @param {Transactions} transactions
     * @param {app.utils.decorators} decorators
     * @param {Assets} assets
     * @param {User} user
     * @param {app.utils} utils
     * @return {Node}
     */
    const factory = function (BaseNodeComponent, aliases, transactions, assets, user, utils, decorators) {

        const ds = require('data-service');

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


            /**
             * @param {string} address
             * @return {Promise<IScriptInfo<Money>>}
             */
            @decorators.cachable(2)
            scriptInfo(address) {
                return ds.api.address.getScriptInfo(address);
            }

            /**
             * @param {string} address
             * @return {boolean}
             */
            isValidAddress(address) {
                try {
                    return ds.isValidAddress(address);
                } catch (e) {
                    return false;
                }
            }

            /**
             * @param {string} address
             * @param {string | number} byte
             * @return {boolean}
             */
            isValidAddressWithNetworkByte(address, byte) {
                try {
                    return ds.isValidAddressWithNetworkByte(address, byte);
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

    factory.$inject = ['BaseNodeComponent', 'aliases', 'transactions', 'assets', 'user', 'utils', 'decorators'];

    angular.module('app')
        .factory('node', factory);
})();

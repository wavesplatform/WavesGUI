(function () {
    'use strict';

    /**
     * @param {BaseNodeComponent} BaseNodeComponent
     * @return {Aliases}
     */
    const factory = function (BaseNodeComponent) {

        const AVAILABLE_CHARS = '-.0123456789@_abcdefghijklmnopqrstuvwxyz';

        class Aliases extends BaseNodeComponent {

            constructor() {
                super();
                this.aliases = [];
            }

            /**
             * Get address by alias
             * @param {string} alias
             * @return {Promise<string>}
             */
            getAddress(alias) {
                return fetch(`${this.network.node}/alias/by-alias/${alias}`)
                    .then(({ address }) => address);
            }

            /**
             * Get alias list by user
             * @return {string[]}
             */
            getAliasList() {
                return this.aliases;
            }

            /**
             * Create alias (transaction)
             * @param {string} alias
             * @param {string} keyPair
             * @param {Money} [fee]
             * @return Promise<ITransaction>
             */
            createAlias({ alias, fee, keyPair }) {
                return this.getFee({ type: WavesApp.TRANSACTION_TYPES.NODE.CREATE_ALIAS, fee }).then((fee) => {
                    return Waves.API.Node.v1.aliases.createAlias({
                        fee: fee.toCoins(),
                        feeAssetId: fee.asset.id,
                        alias
                    }, keyPair)
                        .then(this._pipeTransaction([fee]));
                });
            }

            validate(alias) {
                // TODO : replace with waves-api method when it is implemented
                return alias.length >= 4 &&
                    alias.length <= WavesApp.maxAliasLength &&
                    alias.split('').every((char) => AVAILABLE_CHARS.includes(char));
            }

        }

        return new Aliases();
    };

    factory.$inject = ['BaseNodeComponent'];

    angular.module('app').factory('aliases', factory);
})();

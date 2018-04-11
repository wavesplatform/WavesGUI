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
                return Waves.API.Node.v2.aliases.getAddress(alias).then(({ address }) => address);
            }

            /**
             * Get alias list by user
             * @return {string[]}
             */
            getAliasList() {
                return this.aliases;
            }

            /**
             * Get list of min values fee
             * @return {Promise<Money[]>}
             */
            fee() {
                return this._feeList('createAlias');
            }

            /**
             * Create alias (transaction)
             * @param {string} alias
             * @param {string} keyPair
             * @param {Money} [fee]
             * @return Promise<ITransaction>
             */
            createAlias({ alias, fee, keyPair }) {
                return this.getFee('createAlias', fee).then((fee) => {
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

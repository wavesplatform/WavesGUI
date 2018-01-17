(function () {
    'use strict';

    /**
     * @param {BaseNodeComponent} BaseNodeComponent
     * @param {User} user
     * @param {app.utils} utils
     * @return {Aliases}
     */
    const factory = function (BaseNodeComponent, user, utils) {

        const AVAILABLE_CHARS = '-.0123456789@_abcdefghijklmnopqrstuvwxyz';

        class Aliases extends BaseNodeComponent {

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
             * @return {Promise<string>}
             */
            getAliasList() {
                return Waves.API.Node.v2.addresses.aliasList(user.address)
                    .then((list) => list.sort(utils.comparators.asc));
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
                    alias.split('').some((char) => {
                        return AVAILABLE_CHARS.indexOf(char) !== -1;
                    });
            }

        }

        return new Aliases();
    };

    factory.$inject = ['BaseNodeComponent', 'user', 'utils'];

    angular.module('app').factory('aliases', factory);
})();

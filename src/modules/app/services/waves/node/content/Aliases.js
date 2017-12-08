(function () {
    'use strict';

    /**
     * @param {BaseNodeComponent} BaseNodeComponent
     * @param {User} user
     * @param {app.utils} utils
     * @param {EventManager} eventManager
     * @return {Aliases}
     */
    const factory = function (BaseNodeComponent, user, utils) {

        class Aliases extends BaseNodeComponent {

            /**
             * Get address by alias
             * @param {string} alias
             * @return {Promise<string>}
             */
            getAddress(alias) {

            }

            /**
             * Get alias list by user
             * @return {Promise<string>}
             */
            getAliasList() {
                return Waves.API.Node.v1.aliases.byAddress(user.address)
                    .then((list) => list.map((item) => item.replace(`alias:${WavesApp.network.code}:`, '')))
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

        }

        return new Aliases();
    };

    factory.$inject = ['BaseNodeComponent', 'user', 'utils'];

    angular.module('app').factory('aliases', factory);
})();

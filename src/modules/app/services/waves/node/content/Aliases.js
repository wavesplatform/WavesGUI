(function () {
    'use strict';

    /**
     * @param {BaseNodeComponent} BaseNodeComponent
     * @return {Aliases}
     */
    const factory = function (BaseNodeComponent) {

        const ds = require('data-service');
        const AVAILABLE_CHARS = '-.0123456789@_abcdefghijklmnopqrstuvwxyz';

        class Aliases extends BaseNodeComponent {

            /**
             * Get address by alias
             * @param {string} alias
             * @return {Promise<string>}
             */
            getAddress(alias) {
                return ds.api.aliases.getAddressByAlias(alias)
                    .then(({ address }) => address);
            }

            /**
             * Get alias list by user
             * @return {string[]}
             */
            getAliasList() {
                return ds.dataManager.getLastAliases();
            }

            validate(alias) {
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

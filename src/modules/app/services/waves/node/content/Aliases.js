(function () {
    'use strict';

    const factory = function () {

        class Aliases {

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

            }

            /**
             * Create alias (transaction)
             */
            createAlias() {

            }

        }

        return new Aliases();
    };

    factory.$inject = [];

    angular.module('app').factory('aliases', factory);
})();

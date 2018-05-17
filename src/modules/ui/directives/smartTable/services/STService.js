(function () {
    'use strict';

    const factory = function () {

        class STService {

            constructor() {
                /**
                 * @type {Object.<string, SmartTable>}
                 * @private
                 */
                this._hash = Object.create(null);
            }

            /**
             * @param {SmartTable} table
             */
            register(table) {
                this._hash[table.cid] = table;
            }

            /**
             * @param {string} cid
             * @return {SmartTable}
             */
            getTableByCid(cid) {
                return this._hash[cid];
            }

            /**
             * @param {SmartTable} table
             */
            unregister(table) {
                delete this._hash[table.cid];
            }

        }

        return new STService();
    };

    factory.$inject = [];

    angular.module('app.ui').factory('stService', factory);
})();

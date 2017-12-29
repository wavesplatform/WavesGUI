(function () {
    'use strict';

    /**
     * @return {TxEvent}
     */
    const factory = function () {

        class TxEvent {

            /**
             * @param {string} id
             * @param {Money[]} moneyList
             */
            constructor(id, moneyList) {
                /**
                 * @type {string}
                 */
                this.id = id;
                /**
                 * @type {Money[]}
                 */
                this.moneyList = moneyList;
            }

            /**
             * @returns {Money[]}
             */
            getReservedMoneyList() {
                return this.moneyList;
            }

        }

        return TxEvent;
    };

    factory.$inject = [];

    angular.module('app')
        .factory('TxEvent', factory);
})();

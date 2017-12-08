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
             * @param {Money} balance
             * @return {Money}
             */
            updateBalance(balance) {
                return this.moneyList.reduce((result, item) => {
                    if (result.asset.id === item.asset.id) {
                        result = result.sub(item);
                    }
                    return result;
                }, balance);
            }
        }

        return TxEvent;
    };

    factory.$inject = [];

    angular.module('app')
        .factory('TxEvent', factory);
})();

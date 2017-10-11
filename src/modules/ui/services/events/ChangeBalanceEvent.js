(function () {
    'use strict';

    const factory = function (AppEvent) {

        class ChangeBalanceEvent extends AppEvent {

            /**
             * @constructor
             * @param {string} assetId
             * @param {number} amount
             * @param {IFeeData} fee
             */
            constructor(assetId, amount, fee) {
                super();
                /**
                 * @type {string}
                 * @private
                 */
                this.__assetId = assetId;
                /**
                 * @type {number}
                 * @private
                 */
                this.__amount = fee.id === assetId ? amount + fee.fee : amount;
                /**
                 * @type {IFeeData}
                 * @private
                 */
                this.__fee = fee;
            }

            getBalanceDifference(assetId) {
                if (this.__assetId === assetId) {
                    return this.__amount;
                } else if (assetId === this.__fee.id) {
                    return this.__fee.fee;
                } else {
                    return 0;
                }
            }

        }

        return ChangeBalanceEvent;
    };

    factory.$inject = ['AppEvent'];

    angular.module('app.ui')
        .factory('ChangeBalanceEvent', factory);
})();

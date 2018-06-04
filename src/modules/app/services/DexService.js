(function () {
    'use strict';

    /**
     * @return {DexService}
     */
    const factory = function () {

        class DexService {

            /**
             * @param {Money} amount
             * @param {Money} price
             */
            getTotalPrice(amount, price) {
                const amountTokens = amount.getTokens();
                const priceTokens = price.getTokens();
                return amountTokens.times(priceTokens).toFixed();
            }

        }

        return new DexService();
    };

    angular.module('app').factory('dexService', factory);
})();

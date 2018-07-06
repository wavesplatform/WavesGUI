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
                const precision = price.asset.precision;
                return amountTokens.times(priceTokens).toFormat(precision);
            }

        }

        return new DexService();
    };

    angular.module('app').factory('dexService', factory);
})();

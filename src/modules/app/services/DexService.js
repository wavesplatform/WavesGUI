(function () {
    'use strict';

    /**
     * @return {DexService}
     */
    const factory = function () {

        class DexService {

            /**
             * @param {Money} amount
             * @param {OrderPrice} price
             */
            getTotalPrice(amount, price) {
                const amountTokens = amount.getTokens();
                const priceTokens = price.getTokens();
                const precision = price.pair.priceAsset.precision;
                return amountTokens.mul(priceTokens).toFormat(precision);
            }

        }

        return new DexService();
    };

    angular.module('app').factory('dexService', factory);
})();

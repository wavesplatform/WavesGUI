(function () {
    'use strict';

    const factory = function () {

        class WavesUtils {

            /**
             * Get rate (now or from date)
             * @param {string|IAssetInfo} assetFrom
             * @param {string|IAssetInfo} assetTo
             * @param {Date|number} [date] timestamp or Date
             * @return {Promise<BigNumber>}
             */
            getRate(assetFrom, assetTo, date) {

            }

            /**
             * Get api for current balance from another balance
             * @param {string|IAssetInfo} assetFrom
             * @param {string|IAssetInfo} assetTo
             * @param {Date|number} [date] timestamp or Date
             * @return {Promise<>} // TODO add interface
             */
            getRateApi(assetFrom, assetTo, date) {

            }

            getRateHistory() {

            }

            getChange() {

            }

            getChangeByInterval() {

            }

        }

        return new WavesUtils();
    };

    factory.$inject = [];

    angular.module('app').factory('wavesUtils', factory);
})();

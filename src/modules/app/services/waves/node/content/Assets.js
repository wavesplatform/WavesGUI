(function () {
    'use strict';

    const factory = function () {

        class Assets {

            /**
             * Get Asset info
             * @param {string} assetId
             * @return {Promise<IAssetInfo>}
             */
            info(assetId) {

            }

            /**
             * Get balance by asset id
             * @param {string} assetId
             * @return {Promise<IAssetWithBalance>}
             */
            balance(assetId) {

            }

            /**
             * Get balance list by asset id list
             * @param {string[]} assetIdList
             * @return {Promise<IAssetWithBalance[]>}
             */
            balanceList(assetIdList) {

            }

            /**
             * Get balance list by user address
             * @return {Promise<IAssetWithBalance[]>}
             */
            userBalances() {

            }

            /**
             * Create transfer transaction
             */
            transfer() {

            }

            /**
             * Create issue transaction
             */
            issue() {

            }

            /**
             * Create reissue transaction
             */
            reissue() {

            }

            /**
             * Create burn transaction
             */
            burn() {

            }

            distribution() {

            }

        }

        return new Assets();
    };

    factory.$inject = [];

    angular.module('app').factory('assets', factory);
})();

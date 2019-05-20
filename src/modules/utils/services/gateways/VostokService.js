(function () {
    'use strict';

    const GATEWAYS = {
        [WavesApp.defaultAssets.VOSTOK]: { waves: 'WVOSTOK', gateway: 'VOSTOK' }
    };

    const PATH = 'https://gateways-dev.wvservices.com/api/v1';

    /**
     * @returns {VostokService}
     */

    const factory = function () {

        class VostokService {

            /**
             * @param {Asset} asset
             * @return {IGatewaySupportMap}
             */
            getSupportMap(asset) {
                if (GATEWAYS[asset.id]) {
                    return {
                        deposit: true,
                        withdraw: true
                    };
                }
            }

            /**
             * From Vostok to Waves
             * @param {Asset} asset
             * @param {string} wavesAddress
             * @return {Promise}
             */
            getDepositDetails(asset, wavesAddress) {
                VostokService._assertAsset(asset.id);

                const data = JSON.stringify({
                    userAddress: wavesAddress,
                    assetId: asset.id
                });

                return $.post(`${PATH}/external/deposit`, data).then((details) => {
                    return {
                        address: details.address,
                        minimumAmount: new BigNumber(details.minAmount),
                        maximumAmount: new BigNumber(details.maxAmount),
                        gatewayFee: new BigNumber(details.fee)
                    };
                });
            }

            /**
             * From Waves to Vostok
             * @param {Asset} asset
             * @param {string} targetAddress
             * @param {string} [paymentId]
             * @return {Promise}
             */
            getWithdrawDetails(asset, targetAddress) {
                VostokService._assertAsset(asset.id);

                const data = JSON.stringify({
                    userAddress: targetAddress,
                    assetId: asset.id
                });
                return $.post(`${PATH}/external/withdraw`, data).then((details) => {
                    return ({
                        address: details.recipientAddress,
                        minimumAmount: new BigNumber(details.minAmount),
                        maximumAmount: new BigNumber(details.maxAmount),
                        gatewayFee: new BigNumber(details.fee),
                        attachment: details.processId
                    });
                });
            }

            /**
             * @param {Asset} asset
             * @return {string}
             */
            getAssetKeyName(asset) {
                return `${GATEWAYS[asset.id].gateway}`;
            }

            static _assertAsset(assetId) {
                if (!GATEWAYS[assetId]) {
                    throw new Error('Asset is not supported by Vostok');
                }
            }

        }

        return new VostokService();
    };

    angular.module('app.utils').factory('vostokService', factory);
})();

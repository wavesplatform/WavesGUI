(function () {
    'use strict';

    // const { request } = require('../../../../../data-service/utils/request');
    // const { stringifyJSON } = require('../../../../../data-service/utils/utils');

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
             * From Waves to Vostok
             * @param {Asset} asset
             * @param {string} targetAddress
             * @param {string} [paymentId]
             * @return {Promise}
             */
            getWithdrawDetails(asset, targetAddress) {
                VostokService._assertAsset(asset.id);

                // $.post(`${PATH}/external/withdraw`, {
                //     userAddress: targetAddress,
                //     assetId: asset.id
                // }, (details) => {
                //     return {
                //         address: details.service.recipientAddress,
                //         minimumAmount: new BigNumber(details.service.minAmount),
                //         maximumAmount: new BigNumber(details.service.maxAmount),
                //         gatewayFee: new BigNumber(details.service.fee),
                //         processId: details.service.processId
                //     };
                // });

                return $.post(`${PATH}/external/withdraw`, {
                    userAddress: targetAddress,
                    assetId: asset.id
                }).then((details) => {
                    return {
                        address: details.service.recipientAddress,
                        minimumAmount: new BigNumber(details.service.minAmount),
                        maximumAmount: new BigNumber(details.service.maxAmount),
                        gatewayFee: new BigNumber(details.service.fee),
                        processId: details.service.processId
                    };
                });

                // return request({
                //     url: `${PATH}/external/withdraw`,
                //     fetchOptions: {
                //         method: 'POST',
                //         headers: {
                //             'Accept': 'application/json',
                //             'Content-Type': 'application/json;charset=UTF-8'
                //         },
                //         body: stringifyJSON({
                //             userAddress: targetAddress,
                //             assetId: asset.id
                //         }),
                //     }
                // });
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

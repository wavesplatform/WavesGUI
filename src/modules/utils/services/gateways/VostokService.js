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

                const body = JSON.stringify({
                    userAddress: wavesAddress,
                    assetId: asset.id
                });

                return ds.fetch(`${PATH}/external/deposit`, { method: 'POST', body })
                    .then(details => {
                        const [minAmount, maxAmount, fee] = [details.minAmount, details.maxAmount, details.fee]
                            .map(value => this._normalaizeValue(value, -asset.precision));
                        return ({
                            address: details.address,
                            minimumAmount: new BigNumber(minAmount),
                            maximumAmount: new BigNumber(maxAmount),
                            gatewayFee: new BigNumber(fee)
                        });
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

                const body = JSON.stringify({
                    userAddress: targetAddress,
                    assetId: asset.id
                });

                return ds.fetch(`${PATH}/external/withdraw`, { method: 'POST', body })
                    .then(details => {
                        const [minAmount, maxAmount, fee] = [details.minAmount, details.maxAmount, details.fee]
                            .map(value => this._normalaizeValue(value, -asset.precision));
                        return ({
                            address: details.recipientAddress,
                            minimumAmount: new BigNumber(minAmount),
                            maximumAmount: new BigNumber(maxAmount),
                            gatewayFee: new BigNumber(fee),
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

            /**
             *
             * @param value {number}
             * @param pow {number}
             * @returns {number}
             * @private
             */
            _normalaizeValue(value, pow) {
                return value * Math.pow(10, pow);
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

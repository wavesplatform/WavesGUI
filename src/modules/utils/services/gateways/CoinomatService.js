(function () {
    'use strict';

    const PATH = `${WavesApp.network.coinomat}/api/v1`;
    const LANGUAGE = 'ru_RU';

    // That is used to access values from `**/locales/*.json` files
    const KEY_NAME_PREFIX = 'coinomat';

    /**
     * @param gateways
     * @returns {CoinomatService}
     */
    const factory = function (gateways) {

        class CoinomatService {

            getAll() {
                return gateways;
            }

            /**
             * From Coinomat to Waves
             * @param {Asset} asset
             * @param {string} wavesAddress
             * @return {Promise}
             */
            getDepositDetails(asset, wavesAddress) {
                CoinomatService._isSupportedAsset(asset.id);
                const from = gateways[asset.id].gateway;
                const to = gateways[asset.id].waves;
                return this._loadPaymentDetails(from, to, wavesAddress).then((details) => {
                    return { address: details.tunnel.wallet_from };
                });
            }

            /**
             * From Waves to Coinomat
             * @param {Asset} asset
             * @param {string} targetAddress
             * @param {string} [paymentId]
             * @return {Promise}
             */
            getWithdrawDetails(asset, targetAddress, paymentId) {
                CoinomatService._isSupportedAsset(asset.id);
                const from = gateways[asset.id].waves;
                const to = gateways[asset.id].gateway;
                return Promise.all([
                    this._loadPaymentDetails(from, to, targetAddress, paymentId),
                    this._loadWithdrawRate(from, to)
                ]).then(([details, rate]) => {
                    if (paymentId && details.tunnel.monero_payment_id !== paymentId) {
                        throw new Error('Monero Payment ID is invalid or missing');
                    }

                    return {
                        address: details.tunnel.wallet_from,
                        attachment: details.tunnel.attachment,
                        minimumAmount: new BigNumber(rate.in_min),
                        maximumAmount: new BigNumber(rate.in_max),
                        exchangeRate: new BigNumber(rate.xrate),
                        gatewayFee: new BigNumber(rate.fee_in + rate.fee_out)
                    };
                });
            }

            /**
             * @param {Asset} asset
             * @return {IGatewaySupportMap}
             */
            getSupportMap(asset) {
                if (gateways[asset.id]) {
                    return {
                        deposit: true,
                        withdraw: true
                    };
                }
            }

            getAssetKeyName(asset) {
                return `${KEY_NAME_PREFIX}${gateways[asset.id].gateway}`;
            }

            _loadPaymentDetails(from, to, recipientAddress, paymentId) {
                return $.get(`${PATH}/create_tunnel.php`, {
                    currency_from: from,
                    currency_to: to,
                    wallet_to: recipientAddress,
                    ...(paymentId ? { monero_payment_id: paymentId } : {})
                }).then((res) => {
                    CoinomatService._isEligibleResponse(res, 'ok');
                    return $.get(`${PATH}/get_tunnel.php`, {
                        xt_id: res.tunnel_id,
                        k1: res.k1,
                        k2: res.k2,
                        history: 0,
                        lang: LANGUAGE
                    });
                }).then((res) => {
                    CoinomatService._isEligibleResponse(res, 'tunnel');
                    return res;
                });
            }

            _loadWithdrawRate(from, to) {
                return $.get(`${PATH}/get_xrate.php`, {
                    f: from,
                    t: to,
                    lang: LANGUAGE
                });
            }

            static _isEligibleResponse(response, fieldName) {
                if (!response[fieldName]) {
                    throw new Error(response.error);
                } else {
                    return response;
                }
            }

            static _isSupportedAsset(assetId) {
                if (!gateways[assetId]) {
                    throw new Error('Asset is not supported by Coinomat');
                }
            }

        }

        return new CoinomatService();
    };

    factory.$inject = ['gateways'];

    angular.module('app.utils').factory('coinomatService', factory);
})();

(function () {
    'use strict';

    const PATH = `${WavesApp.network.coinomat}/api/v1`;
    const LANGUAGE = 'ru_RU';

    const CURRENCIES = {
        // TODO : move this list to a server-size DB
        [WavesApp.defaultAssets.BTC]: { waves: 'WBTC', coinomat: 'BTC' },
        [WavesApp.defaultAssets.ETH]: { waves: 'WETH', coinomat: 'ETH' },
        [WavesApp.defaultAssets.LTC]: { waves: 'WLTC', coinomat: 'LTC' },
        [WavesApp.defaultAssets.ZEC]: { waves: 'WZEC', coinomat: 'ZEC' }
    };

    /**
     * @return {CoinomatService}
     */
    const factory = function () {

        class CoinomatService {

            // From Coinomat to Waves
            getDepositDetails(assetId, wavesAddress) {
                CoinomatService._isSupportedAsset(assetId);
                return this._loadPaymentDetails(CURRENCIES[assetId].coinomat, CURRENCIES[assetId].waves, wavesAddress);
            }

            // From Waves to Coinomat
            getWithdrawDetails(assetId, wavesAddress) {
                CoinomatService._isSupportedAsset(assetId);
                return this._loadPaymentDetails(CURRENCIES[assetId].waves, CURRENCIES[assetId].coinomat, wavesAddress);
            }

            /**
             * @param {string|Asset} asset
             * @return {boolean}
             */
            hasSupportOf(asset) {
                const assetId = typeof asset === 'string' ? asset : asset.id;
                return !!CURRENCIES[assetId];
            }

            _loadPaymentDetails(from, to, recipientAddress) {
                return $.get(`${PATH}/create_tunnel.php`, {
                    currency_from: from,
                    currency_to: to,
                    wallet_to: recipientAddress
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
                    return {
                        address: res.tunnel.wallet_from,
                        attachment: res.tunnel.attachment
                    };
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
                if (!CURRENCIES[assetId]) {
                    throw new Error('Asset is not supported by Coinomat');
                }
            }

        }

        return new CoinomatService();
    };

    angular.module('app.utils').factory('coinomatService', factory);
})();

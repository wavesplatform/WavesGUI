(function () {
    'use strict';

    const PATH = `${WavesApp.network.coinomat}/api/v1`;
    const LANGUAGE = 'ru_RU';

    // That is used to access values from `**/locales/*.json` files
    const MOCK_NAME_PREFIX = 'coinomat';

    const SUPPORTED = {
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

        // TODO : make this interface shared for any gateway service

        class CoinomatService {

            /**
             * From Coinomat to Waves
             * @param {Asset} asset
             * @param {string} wavesAddress
             * @return {boolean}
             */
            getDepositDetails(asset, wavesAddress) {
                CoinomatService._isSupportedAsset(asset.id);
                return this._loadPaymentDetails(SUPPORTED[asset.id].coinomat, SUPPORTED[asset.id].waves, wavesAddress);
            }

            /**
             * From Waves to Coinomat
             * @param {Asset} asset
             * @param {string} wavesAddress
             * @return {boolean}
             */
            getWithdrawDetails(asset, wavesAddress) {
                CoinomatService._isSupportedAsset(asset.id);
                return this._loadPaymentDetails(SUPPORTED[asset.id].waves, SUPPORTED[asset.id].coinomat, wavesAddress);
            }

            /**
             * @param {Asset} asset
             * @return {boolean}
             */
            hasSupportOf(asset) {
                return !!SUPPORTED[asset.id];
            }

            /**
             * @param {Asset} asset
             * @return {string}
             */
            getKeyNameFor(asset) {
                if (SUPPORTED[asset.id]) {
                    return `${MOCK_NAME_PREFIX}${SUPPORTED[asset.id].coinomat}`;
                }
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
                if (!SUPPORTED[assetId]) {
                    throw new Error('Asset is not supported by Coinomat');
                }
            }

        }

        return new CoinomatService();
    };

    angular.module('app.utils').factory('coinomatService', factory);
})();

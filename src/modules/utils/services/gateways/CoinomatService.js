(function () {
    'use strict';

    const PATH = `${WavesApp.network.coinomat}/api/v1`;
    const LANGUAGE = 'ru_RU';

    // That is used to access values from `**/locales/*.json` files
    const KEY_NAME_PREFIX = 'coinomat';

    const CURRENCIES = {
        // TODO : move this list to a server-size DB
        [WavesApp.defaultAssets.BTC]: { waves: 'WBTC', gateway: 'BTC' },
        [WavesApp.defaultAssets.ETH]: { waves: 'WETH', gateway: 'ETH' },
        [WavesApp.defaultAssets.LTC]: { waves: 'WLTC', gateway: 'LTC' },
        [WavesApp.defaultAssets.ZEC]: { waves: 'WZEC', gateway: 'ZEC' }
    };

    /**
     * @return {CoinomatService}
     */
    const factory = function () {

        class CoinomatService {

            /**
             * From Coinomat to Waves
             * @param {Asset} asset
             * @param {string} wavesAddress
             * @return {Promise}
             */
            getDepositDetails(asset, wavesAddress) {
                CoinomatService._isSupportedAsset(asset.id);
                return this._loadPaymentDetails(CURRENCIES[asset.id].gateway, CURRENCIES[asset.id].waves, wavesAddress);
            }

            /**
             * From Waves to Coinomat
             * @param {Asset} asset
             * @param {string} wavesAddress
             * @return {Promise}
             */
            getWithdrawDetails(asset, wavesAddress) {
                CoinomatService._isSupportedAsset(asset.id);
                return this._loadPaymentDetails(CURRENCIES[asset.id].waves, CURRENCIES[asset.id].gateway, wavesAddress);
            }

            /**
             * @param {Asset} asset
             * @return {IGatewaySupportMap}
             */
            getSupportMap(asset) {
                if (CURRENCIES[asset.id]) {
                    return {
                        deposit: true,
                        withdraw: true
                    };
                }
            }

            getAssetKeyName(asset) {
                return `${KEY_NAME_PREFIX}${CURRENCIES[asset.id].gateway}`;
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

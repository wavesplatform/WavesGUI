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
        [WavesApp.defaultAssets.ZEC]: { waves: 'WZEC', gateway: 'ZEC' },
        [WavesApp.defaultAssets.BCH]: { waves: 'WBCH', gateway: 'BCH' },
        [WavesApp.defaultAssets.DASH]: { waves: 'WDASH', gateway: 'DASH' }
    };

    /**
     * @return {CoinomatService}
     */
    const factory = function () {

        class CoinomatService {

            getAll() {
                return CURRENCIES;
            }

            /**
             * From Coinomat to Waves
             * @param {Asset} asset
             * @param {string} wavesAddress
             * @return {Promise}
             */
            getDepositDetails(asset, wavesAddress) {
                CoinomatService._isSupportedAsset(asset.id);
                const from = CURRENCIES[asset.id].gateway;
                const to = CURRENCIES[asset.id].waves;
                return this._loadPaymentDetails(from, to, wavesAddress).then((details) => {
                    return { address: details.tunnel.wallet_from };
                });
            }

            /**
             * From Waves to Coinomat
             * @param {Asset} asset
             * @param {string} targetAddress
             * @return {Promise}
             */
            getWithdrawDetails(asset, targetAddress) {
                CoinomatService._isSupportedAsset(asset.id);
                const from = CURRENCIES[asset.id].waves;
                const to = CURRENCIES[asset.id].gateway;
                return Promise.all([
                    this._loadPaymentDetails(from, to, targetAddress),
                    this._loadWithdrawRate(from, to)
                ]).then(([details, rate]) => {
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
                if (!CURRENCIES[assetId]) {
                    throw new Error('Asset is not supported by Coinomat');
                }
            }

        }

        return new CoinomatService();
    };

    angular.module('app.utils').factory('coinomatService', factory);
})();

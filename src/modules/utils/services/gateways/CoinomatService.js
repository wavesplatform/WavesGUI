(function () {
    'use strict';

    const GATEWAYS = {
        [WavesApp.defaultAssets.BTC]: { waves: 'WBTC', gateway: 'BTC' },
        [WavesApp.defaultAssets.ETH]: { waves: 'WETH', gateway: 'ETH' },
        [WavesApp.defaultAssets.LTC]: { waves: 'WLTC', gateway: 'LTC' },
        [WavesApp.defaultAssets.ZEC]: { waves: 'WZEC', gateway: 'ZEC' },
        [WavesApp.defaultAssets.BCH]: { waves: 'WBCH', gateway: 'BCH' },
        [WavesApp.defaultAssets.DASH]: { waves: 'WDASH', gateway: 'DASH' },
        [WavesApp.defaultAssets.XMR]: { waves: 'WXMR', gateway: 'XMR' }
    };

    const PATH = `${WavesApp.network.coinomat}/api/v1`;
    const PATH_V2 = `${WavesApp.network.coinomat}/api/v2`;
    const LANGUAGE = 'ru_RU';

    // That is used to access values from `**/locales/*.json` files
    const KEY_NAME_PREFIX = 'coinomat';
    const ds = require('data-service');

    /**
     * @returns {CoinomatService}
     */
    const factory = function () {

        class CoinomatService {

            getAll() {
                return GATEWAYS;
            }

            /**
             * From Coinomat to Waves
             * @param {Asset} asset
             * @param {string} wavesAddress
             * @return {Promise}
             */
            getDepositDetails(asset, wavesAddress) {
                CoinomatService._assertAsset(asset.id);
                const from = GATEWAYS[asset.id].gateway;
                const to = GATEWAYS[asset.id].waves;
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
                CoinomatService._assertAsset(asset.id);
                const from = GATEWAYS[asset.id].waves;
                const to = GATEWAYS[asset.id].gateway;
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
                if (GATEWAYS[asset.id]) {
                    return {
                        deposit: true,
                        withdraw: true
                    };
                }
            }

            getAssetKeyName(asset) {
                return `${KEY_NAME_PREFIX}${GATEWAYS[asset.id].gateway}`;
            }

            hasConfirmation(address) {
                return $.get(`${PATH_V2}/get_confirmation.php?address=${address}`).then((res) => {
                    const { status, is_confirmed } = JSON.parse(res);

                    if (status === 'not found' || !is_confirmed) {
                        throw new Error('No confirm');
                    }

                    return true;
                });
            }

            async sendConfirmation(public_key, is_confirmed) {
                is_confirmed = is_confirmed ? 1 : 0;

                const tsData = await $.get(`${PATH_V2}/get_ts.php`);
                const { ts } = JSON.parse(tsData);
                const { hashId, next } = await ds.app.signCoinomat(ts);

                return {
                    hashId,
                    next: async () => {
                        const signature = await next();
                        try {
                            const data = await $.post(`${PATH_V2}/set_confirmation.php`, {
                                ts, signature, public_key, is_confirmed
                            });

                            if (!data || data.includes('error')) {
                                throw new Error('dataError');
                            }
                        } catch (e) {
                            throw new Error('serverError');
                        }

                        return true;
                    }
                };
            }

            _loadPaymentDetails(from, to, recipientAddress, paymentId) {
                return $.get(`${PATH}/create_tunnel.php`, {
                    currency_from: from,
                    currency_to: to,
                    wallet_to: recipientAddress,
                    ...(paymentId ? { monero_payment_id: paymentId } : {})
                }).then((res) => {
                    CoinomatService._assertResponse(res, 'ok');
                    return $.get(`${PATH}/get_tunnel.php`, {
                        xt_id: res.tunnel_id,
                        k1: res.k1,
                        k2: res.k2,
                        history: 0,
                        lang: LANGUAGE
                    });
                }).then((res) => {
                    CoinomatService._assertResponse(res, 'tunnel');
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

            static _assertResponse(response, fieldName) {
                if (!response[fieldName]) {
                    throw new Error(response.error);
                }
            }

            static _assertAsset(assetId) {
                if (!GATEWAYS[assetId]) {
                    throw new Error('Asset is not supported by Coinomat');
                }
            }

        }

        return new CoinomatService();
    };

    angular.module('app.utils').factory('coinomatService', factory);
})();

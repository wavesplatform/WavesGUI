(function () {
    'use strict';

    const GATEWAYS = {
        [WavesApp.defaultAssets.BTC]: { waves: 'WBTC', gateway: 'BTC' },
        [WavesApp.defaultAssets.BSV]: { waves: 'WBSV', gateway: 'BSV' },
        [WavesApp.defaultAssets.ETH]: { waves: 'WETH', gateway: 'ETH' },
        [WavesApp.defaultAssets.LTC]: { waves: 'WLTC', gateway: 'LTC' },
        [WavesApp.defaultAssets.ZEC]: { waves: 'WZEC', gateway: 'ZEC' },
        [WavesApp.defaultAssets.BCH]: { waves: 'WBCH', gateway: 'BCH' },
        [WavesApp.defaultAssets.DASH]: { waves: 'WDASH', gateway: 'DASH' },
        [WavesApp.defaultAssets.XMR]: { waves: 'WXMR', gateway: 'XMR' }
    };

    const PATH_V1 = `${WavesApp.network.coinomat}/api/v1`;
    const PATH_V2 = `${WavesApp.network.coinomat}/api/v2`;
    const LANGUAGE = 'ru_RU';

    // That is used to access values from `**/locales/*.json` files
    const KEY_NAME_PREFIX = 'coinomat';
    const ds = require('data-service');
    const { prop } = require('ramda');

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
                        gatewayFee: new BigNumber(rate.fee_out)
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
                        withdraw: true,
                        errorAddressMessage: true
                    };
                }
            }

            getAssetKeyName(asset) {
                return `${KEY_NAME_PREFIX}${GATEWAYS[asset.id].gateway}`;
            }

            /**
             * @param {string} address
             * @return {Promise<boolean>}
             */
            hasConfirmation(address) {
                return ds.fetch(`${PATH_V2}/get_confirmation.php?address=${address}`)
                    .then(({ status, is_confirmed }) => !(status === 'not found' || !is_confirmed));
            }

            /**
             * @param {string} address
             * @return {Promise<boolean>}
             */
            isVerified(address) {
                return ds.fetch(`${PATH_V2}/get_verification_status.php?address=${address}`)
                    .then(prop('verified'));
            }

            /**
             * @return {Promise<number>}
             */
            getCoinomatTimestamp() {
                return ds.fetch(`${PATH_V2}/get_ts.php`)
                    .then(prop('ts'));
            }

            /**
             * @return {string}
             */
            getAddressErrorMessage() {
                return 'Invalid wallet_to';
            }

            /**
             * @param {string} signature
             * @param {number} timestamp
             * @param {boolean} status
             * @return {Promise<void>}
             */
            setCoinomatTermsAccepted(signature, timestamp, status) {
                const confirmed = status ? 1 : 0;

                return ds.signature.getSignatureApi().getPublicKey().then(publicKey => {

                    const params = {
                        signature,
                        public_key: publicKey,
                        ts: timestamp,
                        is_confirmed: confirmed
                    };

                    const toGetParams = params => Object.keys(params).reduce((acc, item) => {
                        const start = acc ? '&' : '';
                        return `${acc}${start}${item}=${params[item]}`;
                    }, '');

                    return ds.fetch(`${PATH_V2}/set_confirmation.php?${toGetParams(params)}`, { method: 'POST' })
                        .then(response => {
                            if (response.status === 'error') {
                                return Promise.reject('Error!');
                            }
                        });
                });
            }

            _loadPaymentDetails(from, to, recipientAddress, paymentId) {
                return $.get(`${PATH_V1}/create_tunnel.php`, {
                    currency_from: from,
                    currency_to: to,
                    wallet_to: recipientAddress,
                    ...(paymentId ? { monero_payment_id: paymentId } : {})
                }).then((res) => {
                    CoinomatService._assertResponse(res, 'ok');
                    return $.get(`${PATH_V1}/get_tunnel.php`, {
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
                return $.get(`${PATH_V1}/get_xrate.php`, {
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

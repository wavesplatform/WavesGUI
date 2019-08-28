(function () {
    'use strict';

    /**
     * @param {CoinomatService} coinomatService
     * @param {CoinomatCardService} coinomatCardService
     * @param {CoinomatSepaService} coinomatSepaService
     * @param {WavesGatewayService} wavesGatewayService
     * @param {ConfigService} configService
     * @return {GatewayService}
     */
    const factory = function (coinomatService, coinomatCardService,
                              coinomatSepaService, wavesGatewayService, configService) {

        class GatewayService {

            constructor() {
                this.gateways = [
                    coinomatService,
                    coinomatCardService,
                    coinomatSepaService,
                    wavesGatewayService
                ];
            }

            getCryptocurrencies() {
                return {
                    ...coinomatService.getAll(),
                    ...wavesGatewayService.getAll()
                };
            }

            getPurchasableWithCards() {
                return coinomatCardService.getAll();
            }

            getFiats() {
                return coinomatSepaService.getAll();
            }

            /**
             * @param {Asset} asset
             * @param {string} wavesAddress
             * @return {Promise}
             */
            getDepositDetails(asset, wavesAddress) {
                const gateway = this._findGatewayFor(asset, 'deposit');

                if (gateway) {
                    return gateway.getDepositDetails(asset, wavesAddress);
                }

                return null;
            }

            /**
             * @param {Asset} asset
             * @param {string} targetAddress
             * @param {string} [paymentId]
             * @return {Promise<IGatewayDetails>}
             */
            getWithdrawDetails(asset, targetAddress, paymentId) {
                const gateway = this._findGatewayFor(asset, 'withdraw');

                if (!this.canUseGateway(asset)) {
                    return Promise.reject({ code: 1001, message: 'Gateway is blocked' });
                }

                return gateway.getWithdrawDetails(asset, targetAddress, paymentId);
            }

            canUseGateway(asset) {
                return !configService
                    .get('PERMISSIONS.CANT_TRANSFER_GATEWAY')
                    .includes(asset.id);
            }

            /**
             * @param {Asset} crypto
             * @param {string} wavesAddress
             * @return {Promise<object>}
             */
            getCardFiatWithLimits(crypto, wavesAddress, fiatList) {
                const gateway = this._findGatewayFor(crypto, 'card');
                return gateway.getFiatWithLimits(crypto, wavesAddress, fiatList);
            }

            /**
             * @param {Asset} crypto
             * @param {string} fiat
             * @param {string} recipientAddress
             * @param {number} fiatAmount
             * @return {Promise<number>}
             */
            getCardApproximateCryptoAmount(crypto, fiat, recipientAddress, fiatAmount) {
                const gateway = this._findGatewayFor(crypto, 'card');
                if (!gateway) {
                    return Promise.resolve(0);
                } else {
                    return gateway.getApproximateCryptoAmount(crypto, fiat, recipientAddress, fiatAmount);
                }
            }

            /**
             * @param {Asset} crypto
             * @param {string} fiat
             * @param {string} recipientAddress
             * @param {number} fiatAmount
             * @return {string}
             */
            getCardBuyLink(crypto, fiat, recipientAddress, fiatAmount) {
                const gateway = this._findGatewayFor(crypto, 'card');
                if (!gateway) {
                    return '';
                } else {
                    return gateway.getCardBuyLink(crypto, fiat, recipientAddress, fiatAmount);
                }
            }

            /**
             * @param {Asset} asset
             * @param {string} wavesAddress
             * @return {Promise}
             */
            getSepaDetails(asset, wavesAddress) {
                const gateway = this._findGatewayFor(asset, 'sepa');

                if (gateway) {
                    return gateway.getSepaDetails(asset, wavesAddress);
                }

                return null;
            }

            /**
             * @param {Asset} asset
             * @param {IGatewayType} type
             * @return {boolean}
             */
            hasSupportOf(asset, type) {
                const gateway = this._findGatewayFor(asset, type);
                return !!gateway;
            }

            /**
             * @param {Asset} asset
             * @param {IGatewayType} type
             * @return {string}
             */
            getAssetKeyName(asset, type) {
                // TODO : find a way to not use it and remove this method
                const gateway = this._findGatewayFor(asset, type);
                return gateway.getAssetKeyName(asset);
            }

            /**
             * @param {Asset} asset
             * @param {IGatewayType} type
             * @return {string}
             */
            getAddressErrorMessage(asset, address, type) {
                const gateway = this._findGatewayFor(asset, type);
                return gateway.getAddressErrorMessage(address);
            }

            /**
             * @param {Asset} asset
             * @param {IGatewayType} type
             * @return {string | null}
             */
            getWrongAddressMessage(asset, address, type) {
                const gateway = this._findGatewayFor(asset, type);

                if (!gateway) {
                    return null;
                }

                return gateway.getWrongAddressMessage(address, asset);
            }

            /**
             * @param {string} address
             * @return {Promise}
             */
            hasConfirmation(address) {
                return coinomatService.hasConfirmation(address);
            }

            getDefaultCardFiatList() {
                const FIAT_CODES = {
                    [WavesApp.defaultAssets.USD]: 'USD',
                    [WavesApp.defaultAssets.EUR]: 'EURO'
                };

                return [
                    {
                        name: 'USD',
                        assetId: WavesApp.defaultAssets.USD,
                        fiatCode: FIAT_CODES[WavesApp.defaultAssets.USD],
                        min: '30',
                        max: '50'
                    },
                    {
                        name: 'EUR',
                        assetId: WavesApp.defaultAssets.EUR,
                        fiatCode: FIAT_CODES[WavesApp.defaultAssets.EUR],
                        min: '30',
                        max: '50'
                    }
                ];
            }

            /**
             * @param {Asset} asset
             * @param {string} type
             * @return {IGateway}
             */
            _findGatewayFor(asset, type) {
                // TODO : right now it returns only the first entry
                // TODO : make it return a list of all available gateways
                for (const gateway of this.gateways) {
                    const supportMap = gateway.getSupportMap(asset);
                    if (supportMap && supportMap[type]) {
                        return gateway;
                    }
                }
            }

        }

        return new GatewayService();
    };

    factory.$inject = [
        'coinomatService',
        'coinomatCardService',
        'coinomatSepaService',
        'wavesGatewayService',
        'configService'
    ];

    angular.module('app.utils').factory('gatewayService', factory);
})();

/**
 * @typedef {('deposit'|'withdraw'|'sepa'|'card')} IGatewayType
 */

/**
 * @typedef {object} IGateway
 * @property {Function} getSupportMap
 * @property {Function} getAssetKeyName
 * @property {Function} [getDepositDetails]
 * @property {Function} [getWithdrawDetails]
 * @property {Function} [getSepaDetails]
 * @property {Function} [getCardDetails]
 */

/**
 * @typedef {object} IGatewaySupportMap
 * @property {boolean} [deposit]
 * @property {boolean} [withdraw]
 * @property {boolean} [sepa]
 * @property {boolean} [card]
 */

/**
 * @typedef {object} IGatewayDetails
 * @property {string} address
 * @property {string} attachment
 * @property {BigNumber} exchangeRate
 * @property {BigNumber} gatewayFee
 * @property {BigNumber} maximumAmount
 * @property {BigNumber} minimumAmount
 */

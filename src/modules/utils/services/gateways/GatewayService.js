(function () {
    'use strict';

    const CARDS_PAYMENTS_AVAILABLE = {
        [WavesApp.defaultAssets.WAVES]: true
    };

    /**
     * @param {CoinomatService} coinomatService
     * @param {CoinomatSepaService} coinomatSepaService
     * @return {GatewayService}
     */
    const factory = function (coinomatService, coinomatSepaService) {

        class GatewayService {

            constructor() {
                this.gateways = [
                    coinomatService,
                    coinomatSepaService
                ];
            }

            getCryptocurrencies() {
                return coinomatService.getAll();
            }

            getPurchasableByCards() {
                return CARDS_PAYMENTS_AVAILABLE;
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
             * @return {Promise<IGatewayDetails>}
             */
            getWithdrawDetails(asset, targetAddress) {
                const gateway = this._findGatewayFor(asset, 'withdraw');
                return gateway.getWithdrawDetails(asset, targetAddress);
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
             */
            getCardDetails(asset) {
                return CARDS_PAYMENTS_AVAILABLE[asset.id] || false;
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

    factory.$inject = ['coinomatService', 'coinomatSepaService'];

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

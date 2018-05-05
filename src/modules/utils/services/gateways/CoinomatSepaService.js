(function () {
    'use strict';

    const KNOWLEDGE_BASE = `${WavesApp.network.support}/forums/2-knowledge-base/topics`;
    const SEPA_COUNTRIES_URL = `${KNOWLEDGE_BASE}/1304-list-of-accepted-countries-and-documents-for-verification`;

    const ID_NOW_SITE_URL = 'https://idnow.eu';
    const ID_NOW_PATH = 'https://go.idnow.de/coinomat/userdata';

    // That is used to access values from `**/locales/*.json` files
    const KEY_NAME_PREFIX = 'coinomatSepa';

    const CURRENCIES = {
        // TODO : move this list to a server-size DB
        [WavesApp.defaultAssets.USD]: 'USD',
        [WavesApp.defaultAssets.EUR]: 'EUR',
        [WavesApp.defaultAssets.TRY]: 'TRY'
    };

    /**
     * @return {CoinomatSepaService}
     */
    const factory = function () {

        class CoinomatSepaService {

            getAll() {
                return CURRENCIES;
            }

            /**
             * @param {Asset} asset
             * @param {string} wavesAddress
             * @return {Promise}
             */
            getSepaDetails(asset, wavesAddress) {
                CoinomatSepaService._isSupportedAsset(asset.id);
                return Promise.resolve({
                    listOfEligibleCountries: SEPA_COUNTRIES_URL,
                    idNowSiteUrl: ID_NOW_SITE_URL,
                    idNowUserLink: `${ID_NOW_PATH}/${wavesAddress}`
                });
            }

            /**
             * @param {Asset} asset
             * @return {IGatewaySupportMap}
             */
            getSupportMap(asset) {
                if (CURRENCIES[asset.id]) {
                    return { sepa: true };
                }
            }

            getAssetKeyName(asset) {
                return `${KEY_NAME_PREFIX}${CURRENCIES[asset.id]}`;
            }

            static _isSupportedAsset(assetId) {
                if (!CURRENCIES[assetId]) {
                    throw new Error('Asset is not supported by Coinomat SEPA');
                }
            }

        }

        return new CoinomatSepaService();
    };

    angular.module('app.utils').factory('coinomatSepaService', factory);
})();

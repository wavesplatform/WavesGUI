(function () {
    'use strict';

    /**
     * @name app.defaultSetting
     */

    /**
     * @param {app.utils} utils
     * @returns {app.defaultSetting}
     */
    const factory = function (utils) {

        class DefaultSettings {

            constructor(settings) {
                /**
                 * @private
                 */
                this.settings = settings;
                /**
                 * @type {Signal}
                 */
                this.change = new tsUtils.Signal();
                /**
                 * @private
                 */
                this.defaults = {
                    logoutAfterMin: 5,
                    encryptionRounds: 5000,
                    savePassword: false,
                    baseAssetId: WavesApp.defaultAssets.USD,
                    events: Object.create(null),
                    wallet: {
                        assets: {
                            mode: 'week',
                            assetList: [
                                WavesApp.defaultAssets.Waves,
                                WavesApp.defaultAssets.BTC,
                                WavesApp.defaultAssets.EUR
                            ]
                        }
                    },
                    dex: {
                        amountAssetId: WavesApp.defaultAssets.Waves,
                        priceAssetId: WavesApp.defaultAssets.BTC,
                        directives: {
                            markets: {
                                activeAssetId: WavesApp.defaultAssets.ETH,
                                favoriteIds: Object.values(WavesApp.defaultAssets)
                            }
                        }
                    }
                };
            }

            get(path) {
                return tsUtils.get(this.settings, path) || tsUtils.get(this.defaults, path) || Object.create(null);
            }

            set(path, value) {
                if (this.get(path) === value) {
                    return null;
                }
                if (utils.isEqual(tsUtils.get(this.defaults, path), value)) {
                    tsUtils.unset(this.settings, path);
                } else {
                    tsUtils.set(this.settings, path, value);
                }
                this.change.dispatch();
            }

            getSettings() {
                return this.settings;
            }

        }

        return {
            /**
             * @name app.defaultSettings#create
             * @param {object} settings
             * @returns {DefaultSettings}
             */
            create(settings) {
                return new DefaultSettings(settings);
            }
        };
    };

    factory.$inject = ['utils'];

    angular.module('app')
        .factory('defaultSettings', factory);
})();

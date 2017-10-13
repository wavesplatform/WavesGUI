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
                        activeState: 'assets',
                        assets: {
                            chartMode: 'week',
                            assetList: [
                                WavesApp.defaultAssets.WAVES,
                                WavesApp.defaultAssets.BTC,
                                WavesApp.defaultAssets.EUR
                            ]
                        },
                        transactions: {
                            filter: 'all'
                        }
                    },
                    dex: {
                        amountAssetId: WavesApp.defaultAssets.WAVES,
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
                return tsUtils.get(this.settings, path) || tsUtils.get(this.defaults, path);
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

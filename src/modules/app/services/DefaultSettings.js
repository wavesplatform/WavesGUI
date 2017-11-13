(function () {
    'use strict';

    /**
     * @name app.defaultSetting
     */

    /**
     * @param {app.utils} utils
     * @return {app.defaultSetting}
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
                    savePassword: true,
                    termsAccepted: true,
                    baseAssetId: WavesApp.defaultAssets.USD,
                    events: Object.create(null),
                    wallet: {
                        activeState: 'assets',
                        assets: {
                            chartMode: 'week',
                            activeChartAssetId: WavesApp.defaultAssets.WAVES,
                            chartAssetIds: [
                                WavesApp.defaultAssets.WAVES,
                                WavesApp.defaultAssets.BTC,
                                WavesApp.defaultAssets.ETH
                            ],
                            assetList: [
                                WavesApp.defaultAssets.USD,
                                WavesApp.defaultAssets.EUR,
                                WavesApp.defaultAssets.WAVES,
                                WavesApp.defaultAssets.BTC,
                                WavesApp.defaultAssets.ETH
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
                const setting = tsUtils.get(this.settings, path);
                return tsUtils.isEmpty(setting) ? tsUtils.get(this.defaults, path) : setting;
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
             * @return {DefaultSettings}
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

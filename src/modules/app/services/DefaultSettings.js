(function () {
    'use strict';

    const factory = function () {

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
                    wallet: {
                        assets: {
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
                return tsUtils.get(this.settings, path) || tsUtils.get(this.defaults, path);
            }

            set(path, value) {
                if (this.get(path) === value) {
                    return null;
                }
                if (tsUtils.get(this.defaults, path) === value) {
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
            create(settings) {
                return new DefaultSettings(settings);
            }
        };
    };

    angular.module('app')
        .factory('defaultSettings', factory);
})();

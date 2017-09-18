(function () {
    'use strict';

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
            create(settings) {
                return new DefaultSettings(settings);
            }
        };
    };

    factory.$inject = ['utils'];

    angular.module('app')
        .factory('defaultSettings', factory);
})();

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
                            assetList: this._getDefaultAssets()
                        }
                    },
                    dex: {
                        amountAssetId: WavesApp.defaultAssets.Waves,
                        priceAssetId: WavesApp.defaultAssets.BTC
                    }
                };
            }

            get(path) {
                return tsUtils.get(this.settings, path) || tsUtils.get(this.defaults, path);
            }

            set(path, value) {
                tsUtils.set(this.settings, path, value);
                this.change.dispatch();
            }

            getSettings() {
                return this.settings;
            }

            _getDefaultAssets() {
                return ['Waves', 'BTC', 'ETH'].map((name) => {
                    return WavesApp.defaultAssets[name];
                });
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

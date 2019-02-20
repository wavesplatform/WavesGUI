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
                    advancedMode: false,
                    network: WavesApp.network,
                    lastOpenVersion: '',
                    whatsNewList: [],
                    closedNotification: [],
                    withScam: false,
                    scamListUrl: WavesApp.network.scamListUrl,
                    shareAnalytics: false,
                    logoutAfterMin: 5,
                    encryptionRounds: 5000,
                    savePassword: true,
                    hasBackup: true,
                    termsAccepted: true,
                    baseAssetId: WavesApp.defaultAssets.USD,
                    assetsOracle: WavesApp.oracle,
                    events: Object.create(null),
                    lng: 'en',
                    send: {
                        defaultTab: 'singleSend'
                    },
                    orderLimit: 0.05,
                    pinnedAssetIdList: [
                        WavesApp.defaultAssets.WAVES,
                        WavesApp.defaultAssets.BTC,
                        WavesApp.defaultAssets.ETH,
                        WavesApp.defaultAssets.USD,
                        WavesApp.defaultAssets.EUR,
                        WavesApp.defaultAssets.LTC,
                        WavesApp.defaultAssets.ZEC,
                        WavesApp.defaultAssets.BCH,
                        WavesApp.defaultAssets.BSV,
                        WavesApp.defaultAssets.TRY,
                        WavesApp.defaultAssets.DASH,
                        WavesApp.defaultAssets.XMR
                    ],
                    wallet: {
                        activeState: 'assets',
                        assets: {
                            chartMode: 'month',
                            activeChartAssetId: WavesApp.defaultAssets.WAVES,
                            chartAssetIdList: [
                                WavesApp.defaultAssets.WAVES,
                                WavesApp.defaultAssets.BTC,
                                WavesApp.defaultAssets.ETH
                            ]
                        },
                        transactions: {
                            filter: 'all'
                        },
                        leasing: {
                            filter: 'all'
                        },
                        portfolio: {
                            spam: [],
                            filter: 'active'
                        }
                    },
                    dex: {
                        chartCropRate: 1.5,
                        assetIdPair: {
                            amount: WavesApp.defaultAssets.WAVES,
                            price: WavesApp.defaultAssets.BTC
                        },
                        watchlist: {
                            showOnlyFavorite: false,
                            favourite: [
                                [WavesApp.defaultAssets.WAVES, WavesApp.defaultAssets.BTC]
                            ],
                            activeTab: 'all'
                        },
                        layout: {
                            watchlist: {
                                collapsed: false
                            },
                            orderbook: {
                                collapsed: false
                            },
                            tradevolume: {
                                collapsed: true
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
                if (utils.isEqual(this.get(path), value)) {
                    return null;
                }
                if (utils.isEqual(tsUtils.get(this.defaults, path), value)) {
                    tsUtils.unset(this.settings, path);
                } else {
                    tsUtils.set(this.settings, path, value);
                }
                this.change.dispatch(path);
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

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

            constructor(settings, commonSettings) {
                /**
                 * @private
                 */
                this.commonSettings = commonSettings || Object.create(null);
                /**
                 * @private
                 */
                this.settings = settings || Object.create(null);
                /**
                 * @type {Signal}
                 */
                this.change = new tsUtils.Signal();
                /**
                 * @private
                 */
                this.commonDefaults = {
                    lng: 'en',
                    theme: 'default',
                    advancedMode: false,
                    lastOpenVersion: '',
                    whatsNewList: [],
                    network: WavesApp.network,
                    oracleWaves: WavesApp.oracles.waves,
                    dontShowSpam: true,
                    logoutAfterMin: 5,
                    termsAccepted: true,
                    needReadNewTerms: false,
                    closedNotification: [],
                    withScam: false,
                    scamListUrl: WavesApp.network.scamListUrl,
                    tokensNameListUrl: WavesApp.network.tokensNameListUrl,
                    tradeWithScriptAssets: false,
                    baseAssetId: WavesApp.defaultAssets.USD,
                    events: Object.create(null)
                };
                /**
                 * @private
                 */
                this.defaults = {
                    encryptionRounds: 5000,
                    hasBackup: true,
                    lastInterval: WavesApp.dex.defaultResolution,
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
                        WavesApp.defaultAssets.XMR,
                        WavesApp.defaultAssets.VST,
                        WavesApp.defaultAssets.ERGO,
                        WavesApp.defaultAssets.BNT
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
                        createOrder: {
                            expirationName: '30day'
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
                const valueCommon = tsUtils.get(this.commonSettings, path);

                if (tsUtils.isEmpty(valueCommon)) {
                    const defaultCommonValue = tsUtils.get(this.commonDefaults, path);

                    if (tsUtils.isEmpty(defaultCommonValue)) {
                        const value = tsUtils.get(this.settings, path);

                        if (tsUtils.isEmpty(value)) {
                            return tsUtils.get(this.defaults, path);
                        } else {
                            return value;
                        }
                    } else {
                        return defaultCommonValue;
                    }
                } else {
                    return valueCommon;
                }
            }

            set(path, value) {
                if (utils.isEqual(this.get(path), value)) {
                    return null;
                }

                if (tsUtils.isEmpty(tsUtils.get(this.defaults, path))) {
                    if (utils.isEqual(tsUtils.get(this.commonDefaults, path), value)) {
                        tsUtils.unset(this.commonSettings, path);
                    } else {
                        tsUtils.set(this.commonSettings, path, value);
                    }
                } else if (utils.isEqual(tsUtils.get(this.defaults, path), value)) {
                    tsUtils.unset(this.settings, path);
                } else {
                    tsUtils.set(this.settings, path, value);
                }

                this.change.dispatch(path);
            }

            setCommonSettings(commonSettings) {
                this.commonSettings = commonSettings;
            }

            getSettings() {
                return {
                    common: this.commonSettings,
                    settings: this.settings
                };
            }

        }

        return {
            /**
             * @name app.defaultSettings#create
             * @param {object} settings
             * @param {object} commonSettings
             * @return {DefaultSettings}
             */
            create(settings, commonSettings) {
                return new DefaultSettings(settings, commonSettings);
            }
        };
    };

    factory.$inject = ['utils'];

    angular.module('app')
        .factory('defaultSettings', factory);
})();

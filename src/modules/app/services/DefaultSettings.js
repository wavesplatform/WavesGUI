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
                    network: WavesApp.network,
                    lastOpenVersion: '',
                    whatsNewList: [],
                    shareAnalytics: false,
                    logoutAfterMin: 5,
                    encryptionRounds: 5000,
                    savePassword: true,
                    hasBackup: true,
                    termsAccepted: true,
                    baseAssetId: WavesApp.defaultAssets.USD,
                    events: Object.create(null),
                    lng: 'en',
                    send: {
                        defaultTab: 'singleSend'
                    },
                    pinnedAssetIdList: [
                        WavesApp.defaultAssets.WAVES,
                        WavesApp.defaultAssets.BTC,
                        WavesApp.defaultAssets.ETH,
                        WavesApp.defaultAssets.USD,
                        WavesApp.defaultAssets.EUR,
                        WavesApp.defaultAssets.LTC,
                        WavesApp.defaultAssets.ZEC,
                        WavesApp.defaultAssets.BCH,
                        WavesApp.defaultAssets.TRY,
                        WavesApp.defaultAssets.DASH
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
                            activeWatchListId: 'top',
                            top: {
                                baseAssetId: WavesApp.defaultAssets.WAVES,
                                list: [
                                    WavesApp.defaultAssets.WAVES,
                                    WavesApp.defaultAssets.BTC,
                                    WavesApp.defaultAssets.DASH,
                                    WavesApp.defaultAssets.TRY,
                                    'HzfaJp8YQWLvQG4FkUxq2Q7iYWMYQ2k8UF89vVJAjWPj',
                                    'ABFYQjwDHSct6rNk59k3snoZfAqNHVZdHz4VGJe2oCV5',
                                    '474jTeYx2r2Va35794tCScAXWJG9hU2HcgxzMowaZUnu',
                                    'Gtb1WRznfchDnTh37ezoDTJ4wcoKaRsKqKjJjy7nm2zU',
                                    'DHgwrRvVyqJsepd32YbBqUeDH4GJ1N984X8QoekjgH8J',
                                    '4uK8i4ThRGbehENwa6MxyLtxAjAo1Rj9fduborGExarC',
                                    'HZk1mbfuJpmxU1Fs4AX5MWLVYtctsNcg6e2C6VKqK8zk',
                                    'GdnNbe6E3txF63gv3rxhpfxytTJtG7ZYyHAvWWrrEbK5',
                                    'Ft8X1v1LTa1ABafufpaCWyVj8KkaxUWE6xBhW6sNFJck',
                                    'K5JcgN8UdwNdh5sbdAuPMm5XEd5aFvoXaC3iHsHVz1d',
                                    '725Yv9oceWsB4GsYwyy4A52kEwyVrL5avubkeChSnL46',
                                    '8t8DMJFQu5GEhvAetiA8aHa3yPjxLj54sBnZsjnJ5dsw',
                                    '4eT6R8R2XuTcBuTHiXVQsh2dN2mg3c2Qnp95EWBNHygg',
                                    'BrjUWjndUanm5VsJkbUip8VRYy6LWJePtxya3FNv4TQa',
                                    '3SdrmU1GGZRiZz12MrMcfUz4JksTzvcU25cLFXpZy1qz',
                                    'FLbGXzrpqkvucZqsHDcNxePTkh2ChmEi4GdBfDRRJVof',
                                    '5ZPuAVxAwYvptbCgSVKdTzeud9dhbZ7vvxHVnZUoxf4h',
                                    'zMFqXuoyrn5w17PFurTqxB7GsS71fp9dfk6XFwxbPCy',
                                    'APz41KyoKuBBh8t3oZjqvhbbsg6f63tpZM5Ck5LYx6h',
                                    'AxAmJaro7BJ4KasYiZhw7HkjwgYtt2nekPuF2CN9LMym'
                                ]
                            },
                            bottom: {
                                baseAssetId: WavesApp.defaultAssets.BTC,
                                list: [
                                    WavesApp.defaultAssets.WAVES,
                                    WavesApp.defaultAssets.BTC,
                                    WavesApp.defaultAssets.DASH,
                                    WavesApp.defaultAssets.TRY,
                                    'HzfaJp8YQWLvQG4FkUxq2Q7iYWMYQ2k8UF89vVJAjWPj',
                                    'ABFYQjwDHSct6rNk59k3snoZfAqNHVZdHz4VGJe2oCV5',
                                    '474jTeYx2r2Va35794tCScAXWJG9hU2HcgxzMowaZUnu',
                                    'Gtb1WRznfchDnTh37ezoDTJ4wcoKaRsKqKjJjy7nm2zU',
                                    'DHgwrRvVyqJsepd32YbBqUeDH4GJ1N984X8QoekjgH8J',
                                    '4uK8i4ThRGbehENwa6MxyLtxAjAo1Rj9fduborGExarC',
                                    'HZk1mbfuJpmxU1Fs4AX5MWLVYtctsNcg6e2C6VKqK8zk',
                                    'GdnNbe6E3txF63gv3rxhpfxytTJtG7ZYyHAvWWrrEbK5',
                                    'Ft8X1v1LTa1ABafufpaCWyVj8KkaxUWE6xBhW6sNFJck',
                                    'K5JcgN8UdwNdh5sbdAuPMm5XEd5aFvoXaC3iHsHVz1d',
                                    '725Yv9oceWsB4GsYwyy4A52kEwyVrL5avubkeChSnL46',
                                    '8t8DMJFQu5GEhvAetiA8aHa3yPjxLj54sBnZsjnJ5dsw',
                                    '4eT6R8R2XuTcBuTHiXVQsh2dN2mg3c2Qnp95EWBNHygg',
                                    'BrjUWjndUanm5VsJkbUip8VRYy6LWJePtxya3FNv4TQa',
                                    '3SdrmU1GGZRiZz12MrMcfUz4JksTzvcU25cLFXpZy1qz',
                                    'FLbGXzrpqkvucZqsHDcNxePTkh2ChmEi4GdBfDRRJVof',
                                    '5ZPuAVxAwYvptbCgSVKdTzeud9dhbZ7vvxHVnZUoxf4h',
                                    'zMFqXuoyrn5w17PFurTqxB7GsS71fp9dfk6XFwxbPCy',
                                    'APz41KyoKuBBh8t3oZjqvhbbsg6f63tpZM5Ck5LYx6h',
                                    'AxAmJaro7BJ4KasYiZhw7HkjwgYtt2nekPuF2CN9LMym'
                                ]
                            }
                        },
                        layout: {
                            left: {
                                collapsed: false,
                                split: 65
                            },
                            center: {
                                split: 75,
                                collapsedBlock: false
                            },
                            right: {
                                collapsed: false,
                                split: 65,
                                collapsedBlock: true
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

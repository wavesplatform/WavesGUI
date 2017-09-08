(function () {
    'use strict';

    /**
     *
     * @param {User} user
     */
    const factory = function (user, $q, decorators) {

        const DEFAULT_ASSETS = ['Waves', 'Bitcoin', 'Ethereum'];
        const EMPTY_ASSET_DATA = {
            balance: 0,
            bid: 0,
            ask: 0
        };

        class AssetsService {

            getAssets() {
                return user.getSetting('assets') || this.getDefaultAssets();
            }

            getDefaultAssets() {
                return DEFAULT_ASSETS.map((name) => {
                    return tsUtils.merge({ name }, EMPTY_ASSET_DATA);
                });
            }

            getGraphOptions() {
                return {
                    margin: {
                        left: -1,
                        top: 20,
                        right: -1
                    },
                    grid: {
                        x: false,
                        y: false
                    },
                    series: [
                        {
                            dataset: 'values',
                            key: 'y',
                            label: 'An area series',
                            color: '#FFAF01',
                            type: ['line', 'line', 'area']
                        }
                    ],
                    axes: {
                        x: {
                            key: 'x',
                            type: 'date',
                            tickFormat: tsUtils.date('DD/MM')
                        }
                    }
                }
            }

            getGraphData(start, end) {
                return this._loadData().then((values) => {
                    return values.filter((item) => {
                        return item.x >= start && item.x <= end;
                    });
                });
            }

            @decorators.cachable(2000)
            _loadData() {
                return fetch('/api/assets-total/balance.json')
                    .then(r => r.json())
                    .then((data) => data.map(item => ({ x: new Date(item.x), y: item.y })));
            }

        }

        return new AssetsService();
    };

    factory.$inject = ['user', '$q', 'decorators'];

    angular.module('app.wallet.assets').factory('assetsService', factory);
})();

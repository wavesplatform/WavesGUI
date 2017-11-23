(function () {
    'use strict';

    /**
     * @param {User} user
     * @param {app.utils.decorators} decorators
     * @param {Waves} waves
     * @param {app.utils} utils
     * @return {AssetsData}
     */
    const factory = function (user, decorators, waves, utils) {

        class AssetsData {

            getAssets() {
                return utils.whenAll(user.getSetting('pinnedAssetIdList').map((assetIdList) => {
                    return waves.node.assets.balance(assetIdList);
                }));
            }

            getGraphOptions() {
                return {
                    grid: {
                        x: false,
                        y: false
                    },
                    series: [
                        {
                            dataset: 'values',
                            key: 'rate',
                            label: 'Rate',
                            color: '#5a81ea',
                            type: ['line', 'area']
                        }
                    ],
                    axes: {
                        x: {
                            key: 'timestamp',
                            type: 'date',
                            ticks: 4
                        },
                        y: {
                            ticks: 4,
                            padding: {
                                max: 4
                            }
                        }
                    }
                };
            }

            getGraphData(start, end) {
                return this._loadData()
                    .then((values) => {
                        return values.filter((item) => {
                            return item.x >= start && item.x <= end;
                        });
                    });
            }

            @decorators.cachable(2)
            _loadData() {
                return fetch('/api/assets-total/balance.json')
                    .then(r => r.json())
                    .then((data) => data.map(item => ({ x: new Date(item.x), y: item.y })));
            }

        }

        return new AssetsData();
    };

    factory.$inject = ['user', 'decorators', 'waves', 'utils'];

    angular.module('app.wallet.assets')
        .factory('assetsData', factory);
})();

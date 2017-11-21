(function () {
    'use strict';

    /**
     * @param {User} user
     * @param {app.utils.decorators} decorators
     * @param apiWorker
     * @param {AssetsService} assetsService
     * @param {app.utils} utils
     * @return {AssetsData}
     */
    const factory = function (user, decorators, apiWorker, assetsService, utils) {

        class AssetsData {

            getAssets() {
                return utils.whenAll(user.getSetting('pinnedAssetIds').map((assetId) => {
                    return assetsService.getBalance(assetId);
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

    factory.$inject = ['user', 'decorators', 'apiWorker', 'assetsService', 'utils'];

    angular.module('app.wallet.assets')
        .factory('assetsData', factory);
})();

(function () {
    'use strict';

    /**
     * @param {User} user
     * @param decorators
     * @param apiWorker
     * @param {AssetsService} assetsService
     * @param {app.utils} utils
     * @return {AssetsData}
     */
    const factory = function (user, decorators, apiWorker, assetsService, utils) {

        class AssetsData {

            getAssets() {
                return user.getSetting('wallet.assets.assetList')
                    .then((assetIds) => {
                        return utils.whenAll(assetIds.map((assetId) => {
                            return assetsService.getBalance(assetId);
                        }));
                    });
            }

            getGraphOptions() {
                return {
                    margin: {
                        left: -1,
                        right: -1
                    },
                    grid: {
                        x: false,
                        y: false
                    },
                    series: [
                        {
                            dataset: 'values',
                            interpolation: {mode: 'cardinal', tension: 0.7},
                            key: 'rate',
                            label: 'Rate',
                            color: '#5a81ea',
                            type: ['line', 'line', 'area']
                        }
                    ],
                    axes: {
                        x: {
                            key: 'timestamp',
                            type: 'date',
                            ticks: 9
                        },
                        y: {
                            ticks: 4
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

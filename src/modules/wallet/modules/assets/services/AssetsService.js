(function () {
    'use strict';

    /**
     * @param {User} user
     * @param decorators
     * @param apiWorker
     * @param {AssetsService} assetsService
     * @return {AssetsService}
     */
    const factory = function (user, decorators, apiWorker, assetsService) {

        class AssetsService {

            getAssets() {
                return user.getSetting('wallet.assets.assetList')
                    .then((assetIds) => {
                        return Promise.all(assetIds.map((assetId) => {
                            return assetsService.getBalance(assetId);
                        }));
                    });
            }

            getGraphOptions() {
                return {
                    margin: {
                        left: -1,
                        top: 60,
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
                            tickFormat: tsUtils.date('DD/MM'),
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

            @decorators.cachable(2000)
            _loadData() {
                return fetch('/api/assets-total/balance.json')
                    .then(r => r.json())
                    .then((data) => data.map(item => ({ x: new Date(item.x), y: item.y })));
            }

        }

        return new AssetsService();
    };

    factory.$inject = ['user', 'decorators', 'apiWorker', 'assetsService'];

    angular.module('app.wallet.assets')
        .factory('wallet.assetsService', factory);
})();

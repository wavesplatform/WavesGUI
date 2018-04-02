(function () {
    'use strict';

    /**
     * @param {User} user
     * @param {app.utils.decorators} decorators
     * @return {AssetsData}
     */
    const factory = function (user, decorators) {

        class AssetsData {

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

            @decorators.cachable(2)
            _loadData() {
                return fetch('/api/assets-total/balance.json')
                    .then((r) => r.json())
                    .then((data) => data.map((item) => ({ x: new Date(item.x), y: item.y })));
            }

        }

        return new AssetsData();
    };

    factory.$inject = ['user', 'decorators', 'waves', 'utils'];

    angular.module('app.wallet.assets')
        .factory('assetsData', factory);
})();

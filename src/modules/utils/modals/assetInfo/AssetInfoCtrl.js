(function () {
    'use strict';

    /**
     * @param Base
     * @param $scope
     * @param {User} user
     * @param createPoll
     * @param {app.utils} utils
     * @param {Waves} waves
     * @return {AssetInfoCtrl}
     */
    const controller = function (Base, $scope, user, createPoll, utils, waves) {

        class AssetInfoCtrl extends Base {

            constructor(asset) {
                super($scope);
                this.asset = asset;
                this.wavesId = WavesApp.defaultAssets.WAVES;

                const assetList = user.getSetting('pinnedAssetIdList');
                this.assetList = assetList;
                this.pinned = assetList.indexOf(asset.id) !== -1;
                this.chartData = null;
                this.circleChartData = null;
                this.totalBalance = null;

                this.chartOptions = {
                    items: {
                        available: {
                            color: '#66bf00',
                            radius: 66
                        },
                        leased: {
                            color: '#ffebc0',
                            radius: 50
                        },
                        inOrders: {
                            color: '#bacaf5',
                            radius: 58
                        }
                    },
                    center: 27,
                    direction: true,
                    startFrom: Math.PI / 2
                };

                this.options = {
                    grid: {
                        x: false,
                        y: false
                    },
                    margin: {
                        top: 0,
                        right: 0,
                        left: 0,
                        bottom: 0
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
                        }
                    }
                };

                createPoll(this, this._getGraphData, 'chartData', 15000);
                createPoll(this, this._getCircleGraphData, this._setCircleGraphData, 15000);
            }

            togglePin() {
                this.assetList = this.assetList.filter(tsUtils.notContains(this.asset.id));
                if (!this.pinned) {
                    this.assetList = this.assetList.concat(this.asset.id);
                }
                this.pinned = !this.pinned;
                user.setSetting('pinnedAssetIdList', this.assetList);
            }

            /**
             * @return {Promise<{values: {rate: number, timestamp: Date}[]}>}
             * @private
             */
            _getGraphData() {
                const startDate = utils.moment().add().day(-100);
                return waves.utils.getRateHistory(this.asset.id, user.getSetting('baseAssetId'), startDate)
                    .then((values) => ({ values }));
            }

            _getCircleGraphData() {
                return waves.node.assets.balance(this.asset.id);
            }

            _setCircleGraphData({ available, leasedOut, inOrders }) {
                this.circleChartData = [
                    { id: 'available', value: available },
                    { id: 'leased', value: leasedOut },
                    { id: 'inOrders', value: inOrders }
                ];
                this.totalBalance = available.add(leasedOut).add(inOrders);
            }

        }

        return new AssetInfoCtrl(this.locals);
    };

    controller.$inject = ['Base', '$scope', 'user', 'createPoll', 'utils', 'waves'];

    angular.module('app.ui').controller('AssetInfoCtrl', controller);
})();

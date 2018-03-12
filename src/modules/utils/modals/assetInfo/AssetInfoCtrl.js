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
                this.transactions = [];
                this.transactionsPending = true;

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
                createPoll(this, waves.node.transactions.list, this._setTxList, 4000, { isBalance: true });
            }

            togglePin() {
                this.assetList = this.assetList.filter(tsUtils.notContains(this.asset.id));
                if (!this.pinned) {
                    this.assetList = this.assetList.concat(this.asset.id);
                }
                this.pinned = !this.pinned;
                user.setSetting('pinnedAssetIdList', this.assetList);
            }

            _setTxList(transactions) {
                this.transactionsPending = false;

                this.transactions = transactions.filter((tx) => {
                    const TYPES = waves.node.transactions.TYPES;

                    switch (tx.type) {
                        case TYPES.SEND:
                        case TYPES.RECEIVE:
                        case TYPES.CIRCULAR:
                            return tx.amount.asset.id === this.asset.id;
                        case TYPES.EXCHANGE_BUY:
                        case TYPES.EXCHANGE_SELL:
                            return (
                                tx.amount.asset.id === this.asset.id ||
                                tx.price.pair.priceAsset.id === this.asset.id
                            );
                        case TYPES.LEASE_IN:
                        case TYPES.LEASE_OUT:
                        case TYPES.CANCEL_LEASING:
                            return this.asset.id === WavesApp.defaultAssets.WAVES;
                        case TYPES.ISSUE:
                        case TYPES.REISSUE:
                        case TYPES.BURN:
                            return tx.quantity.asset.id === this.asset.id;
                        default:
                            return false;
                    }
                });
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

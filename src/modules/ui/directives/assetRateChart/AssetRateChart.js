(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @param {IPollCreate} createPoll
     * @param {Waves} waves
     * @param {app.utils} utils
     * @param {User} user
     * @return {AssetRateChart}
     */
    const controller = function (Base, createPoll, waves, utils, user) {

        class AssetRateChart extends Base {

            constructor() {
                super();

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

                /**
                 * @type {Moment}
                 */
                this.startFrom = null;
                /**
                 * @type {string}
                 */
                this.assetId = null;
                /**
                 * @type {string}
                 */
                this.chartToId = null;
                /**
                 * @type {boolean}
                 */
                this.noUpdate = null;
                /**
                 * @type {Poll}
                 * @private
                 */
                this._poll = null;
            }

            $postLink() {
                this.observe('noUpdate', this._onChangeNoUpdate);
                this.observe(['assetId', 'chartToId', 'startFrom'], this._onChangeMainParams);

                const noUpdate = this.noUpdate;
                if (noUpdate) {
                    this._onChangeMainParams();
                } else {
                    this._poll = this._createPoll();
                }
            }

            /**
             * @private
             */
            _onChangeNoUpdate() {
                const noUpdate = this.noUpdate;

                if (noUpdate && !this._poll) {
                    this._poll = this._createPoll();
                }

                if (!noUpdate && this._poll) {
                    this._poll.destroy();
                    this._poll = null;
                }
            }

            /**
             * @private
             */
            _onChangeMainParams() {
                if (this._poll) {
                    this._poll.restart();
                } else {
                    this._getGraphData().then((values) => {
                        this.chartData = values;
                    });
                }
            }

            /**
             * @return {Promise<{values: {rate: number, timestamp: Date}[]}>}
             * @private
             */
            _getGraphData() {
                const startDate = this.startFrom || utils.moment().add().day(-100);
                const assetId = this.assetId;
                const baseAssetId = this.chartToId || user.getSetting('baseAssetId');

                if (!assetId || (baseAssetId === assetId)) {
                    return Promise.resolve(null);
                }

                return waves.utils.getRateHistory(assetId, baseAssetId, startDate)
                    .then((values) => ({ values }));
            }

            /**
             * @return {Poll}
             * @private
             */
            _createPoll() {
                return createPoll(this, this._getGraphData, 'chartData', 15000);
            }

        }

        return new AssetRateChart();
    };

    controller.$inject = ['Base', 'createPoll', 'waves', 'utils', 'user'];

    angular.module('app.ui').component('wAssetRateChart', {
        bindings: {
            startFrom: '<',
            assetId: '<',
            noUpdate: '<',
            chartToId: '<'
        },
        template: '<linechart ng-if="$ctrl.chartData" options="$ctrl.options" data="$ctrl.chartData"></linechart>',
        transclude: false,
        controller
    });
})();

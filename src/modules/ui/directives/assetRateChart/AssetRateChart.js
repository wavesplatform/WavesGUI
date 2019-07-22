(function () {
    'use strict';

    const { map } = require('ramda');

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

                /**
                 * @type {TChartOptions}
                 * */
                this.options = {
                    axisX: 'timestamp',
                    axisY: 'rate',
                    checkWidth: true,
                    view: {
                        rate: {
                            lineColor: '#5a81ea',
                            fillColor: '#FFF',
                            lineWidth: 4
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

                this._setThemSettings();
            }

            $postLink() {
                this.observe('noUpdate', this._onChangeNoUpdate);
                this.observe(['assetId', 'chartToId', 'startFrom'], this._onChangeMainParams);
                this.observe('theme', this._setThemSettings);
                this.syncSettings({ theme: 'theme' });

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
            _setThemSettings() {
                const { wAssetRateChart } = user.getThemeSettings();
                this.options.view.rate.fillColor = wAssetRateChart.seriesColor;
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
                    this._getGraphData().then(values => {
                        this.chartData = values;
                    }, () => null);
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
                    .then(map(item => ({ ...item, rate: Number(item.rate.toFixed()) })))
                    .then(data => {
                        return ({
                            rate: data
                        });
                    });
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

    controller.$inject = [
        'Base',
        'createPoll',
        'waves',
        'utils',
        'user'
    ];

    angular.module('app.ui').component('wAssetRateChart', {
        bindings: {
            startFrom: '<',
            assetId: '<',
            noUpdate: '<',
            chartToId: '<'
        },
        template: '<w-chart ng-if="$ctrl.chartData" data="$ctrl.chartData" options="$ctrl.options""></w-chart>',
        transclude: false,
        controller
    });
})();

/**
 * @typedef {object} TChartOptions
 * @property {string} axisX
 * @property {string} axisY
 * @property {number} marginBottom
 * @property {boolean} hasDates
 * @property {boolean | number} checkWidth
 * @property {TView} view
 */

/**
 * @typedef {Object<string, IView>} TView
 */

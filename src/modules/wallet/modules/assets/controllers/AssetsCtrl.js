(function () {
    'use strict';

    /**
     * @param {Waves} waves
     * @param {AssetsData} assetsData
     * @param {$rootScope.Scope} $scope
     * @param {app.utils} utils
     * @param {Base} Base
     * @param {User} user
     * @param {ModalManager} modalManager
     * @param {Function} createPoll
     * @return {Assets}
     */
    const controller = function (waves, assetsData, $scope, utils, Base, user, modalManager, createPoll) {

        class Assets extends Base {

            constructor() {
                super($scope);

                /**
                 * @type {string[]}
                 */
                this.pinnedAssetIdList = null;
                /**
                 * @type {Money[]}
                 */
                this.pinnedAssetBalances = null;

                this.chartMode = null;
                this.total = null;

                this.interval = null;
                this.intervalCount = null;

                this.data = null;
                this.options = assetsData.getGraphOptions();
                this.mirrorId = null;
                /**
                 * @type {Moment}
                 * @private
                 */
                this._startDate = null;

                /**
                 * @type {string}
                 */
                this.activeChartAssetId = null;
                /**
                 * @type {Money}
                 */
                this.activeChartBalance = null;
                /**
                 * @type {string[]}
                 */
                this.chartAssetIdList = null;
                /**
                 * @type {Money[]}
                 */
                this.chartBalanceList = null;
                /**
                 * @type {string}
                 */
                this.change = '0.00';
                /**
                 * @type {string}
                 */
                this.changePercent = '0.00';

                const hours = tsUtils.date('hh:mm');
                const dates = tsUtils.date('DD/MM');
                this.options.axes.x.tickFormat = (date) => {
                    if (this.chartMode === 'hour' || this.chartMode === 'day') {
                        return hours(date);
                    } else {
                        return dates(date);
                    }
                };

                this.observe('activeChartAssetId', this._onChangeChartAssetId);

                this.syncSettings({
                    activeChartAssetId: 'wallet.assets.activeChartAssetId',
                    chartAssetIdList: 'wallet.assets.chartAssetIdList',
                    chartMode: 'wallet.assets.chartMode',
                    pinnedAssetIdList: 'pinnedAssetIdList'
                });

                this.mirrorId = user.getSetting('baseAssetId');
                this._onChangeMode();

                this.updateGraph = createPoll(this, this._getGraphData, 'data', 15000);

                createPoll(this, this._getChartBalances, 'chartBalanceList', 15000, { isBalance: true });
                const assetsPoll = createPoll(this, this._getBalances, 'pinnedAssetBalances', 5000, { isBalance: true });

                this.observe('chartMode', this._onChangeMode);
                this.observe('_startDate', this._onChangeInterval);
                this.observe('pinnedAssetIdList', () => {
                    assetsPoll.restart();
                });

                this.observe(['interval', 'intervalCount', 'activeChartAssetId'], this._onChangeInterval);
            }

            abs(num) {
                return Math.abs(num);
            }

            onAssetClick(e, asset) {
                if (e.target.hasAttribute('ng-click') && e.target.tagName !== 'W-ASSET') {
                    return null;
                } else {
                    this.showAsset(asset);
                }
            }

            onAssetClickCallback(event, asset, action) {
                event.preventDefault();
                switch (action) {
                    case 'send':
                        this.showSend(asset);
                        break;
                    case 'receive':
                        this.showReceive(asset);
                        break;
                    default:
                        throw new Error('Wrong action');
                }
            }

            showAsset(asset) {
                return modalManager.showAssetInfo(asset);
            }

            /**
             * @param {IAsset} asset
             */
            showSend(asset = Object.create(null)) {
                return modalManager.showSendAsset({ assetId: asset.id, user, canChooseAsset: !asset.id });
            }

            /**
             * @param {IAsset} [asset]
             */
            showReceive(asset) {
                return waves.node.assets.info(asset && asset.id || WavesApp.defaultAssets.WAVES)
                    .then((asset) => {
                        return modalManager.showReceiveAsset(user, asset);
                    });
            }

            /**
             * @param value
             * @private
             */
            _onChangeChartAssetId({ value }) {
                waves.node.assets.balance(value)
                    .then((asset) => {
                        this.activeChartBalance = asset;
                    });
            }

            _getChartBalances() {
                return waves.node.assets.balanceList(this.chartAssetIdList);
            }

            /**
             * @return {Promise}
             * @private
             */
            _getBalances() {
                return waves.node.assets.balanceList(this.pinnedAssetIdList);
            }

            /**
             * @private
             */
            _onChangeInterval() {
                this.updateGraph.restart();
            }

            /**
             * @return {Promise}
             * @private
             */
            _getGraphData() {
                const from = this.activeChartAssetId;
                const to = this.mirrorId;

                return utils.whenAll([
                    waves.utils.getRateHistory(from, to, this._startDate),
                    waves.utils.getRate(from, to)
                ])
                    .then(([values, rate]) => {
                        this.change = (values[0].rate - values[values.length - 1].rate).toFixed(2);
                        this.changePercent = (this.change * 100 / Number(rate.toString())).toFixed(2);
                        return { values };
                    });
            }

            /**
             * @private
             */
            _onChangeMode() {
                switch (this.chartMode) {
                    case 'hour':
                        this._startDate = utils.moment()
                            .add()
                            .hour(-1);
                        break;
                    case 'day':
                        this._startDate = utils.moment()
                            .add()
                            .day(-1);
                        break;
                    case 'week':
                        this._startDate = utils.moment()
                            .add()
                            .day(-7);
                        break;
                    case 'month':
                        this._startDate = utils.moment()
                            .add()
                            .month(-1);
                        break;
                    case 'year':
                        this._startDate = utils.moment()
                            .add()
                            .year(-1);
                        break;
                    default:
                        throw new Error('Wrong chart mode!');
                }
            }

        }

        return new Assets();
    };

    controller.$inject = [
        'waves',
        'assetsData',
        '$scope',
        'utils',
        'Base',
        'user',
        'modalManager',
        'createPoll'
    ];

    angular.module('app.wallet.assets')
        .controller('AssetsCtrl', controller);
})();

(function () {
    'use strict';

    /**
     * @param {AssetsService} assetsService
     * @param {AssetsData} assetsData
     * @param {$rootScope.Scope} $scope
     * @param {app.utils} utils
     * @param {Base} Base
     * @param {User} user
     * @param {ModalManager} modalManager
     * @param {Function} createPoll
     * @param {Function} createPromise
     * @return {Assets}
     */
    const controller = function (assetsService, assetsData, $scope, utils, Base, user, modalManager, createPoll, createPromise) {

        class Assets extends Base {

            constructor() {
                super($scope);

                this.chartMode = null;
                this.assets = null;
                this.total = null;

                this.interval = null;
                this.intervalCount = null;

                this.data = null;
                this.assetList = null;
                this.options = assetsData.getGraphOptions();
                this.mirrorId = null;

                /**
                 * @type {string}
                 */
                this.activeChartAssetId = null;
                /**
                 * @type {IAssetWithBalance}
                 */
                this.chartAsset = null;
                /**
                 * @type {string[]}
                 */
                this.chartAssetIds = null;
                /**
                 * @type {IAssetWithBalance[]}
                 */
                this.chartBalances = null;

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

                createPromise(this, utils.whenAll([
                    user.getSetting('baseAssetId'),
                    this.syncSettings('wallet.assets.activeChartAssetId'),
                    this.syncSettings('wallet.assets.chartAssetIds'),
                    this.syncSettings('wallet.assets.chartMode'),
                    this.syncSettings('wallet.assets.assetList')
                ]))
                    .then(([baseAssetId]) => {
                        this.mirrorId = baseAssetId;
                        this._onChangeMode();

                        this.updateGraph = createPoll(this, this._getGraphData, 'data', 15000);

                        createPoll(this, this._getChartBalances, 'chartBalances', 15000, { isBalance: true });
                        createPoll(this, this._getBalances, 'assets', 5000, { isBalance: true });

                        this.observe('chartMode', this._onChangeMode);
                        this.observe(['interval', 'intervalCount', 'activeChartAssetId'], this._onChangeInterval);
                    });
            }

            onAssetClick(e, asset) {
                if (e.target.hasAttribute('ng-click')) {
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
             * @param {IAssetInfo} asset
             */
            showSend(asset = Object.create(null)) {
                return modalManager.showSendAsset({ assetId: asset.id, user, canChooseAsset: !asset.id });
            }

            /**
             * @private
             */
            showReceive() {
                return modalManager.showReceiveAsset(user);
            }

            /**
             * @param value
             * @private
             */
            _onChangeChartAssetId({ value }) {
                assetsService.getBalance(value).then((asset) => {
                    this.chartAsset = asset;
                });
            }

            _getChartBalances() {
                return assetsService.getBalanceList(this.chartAssetIds);
            }

            /**
             * @return {Promise}
             * @private
             */
            _getBalances() {
                return assetsService.getBalanceList(this.assetList).then((assets) => {
                    return assets;
                });
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

                return assetsService.getRateHistory(from, to, this.interval, this.intervalCount)
                    .then((values) => {
                        this.change = (values[0].rate - values[values.length - 1].rate).toFixed(2);
                        this.changePercent = (values[values.length - 1].rate / values[0].rate).toFixed(2);
                        return { values };
                    });
            }

            /**
             * @private
             */
            _onChangeMode() {
                switch (this.chartMode) {
                    case 'hour':
                        this.interval = 5;
                        this.intervalCount = 60 / 5;
                        break;
                    case 'day':
                        this.interval = 30;
                        this.intervalCount = 1440 / 30;
                        break;
                    case 'week':
                        this.interval = 240;
                        this.intervalCount = 1440 * 7 / 240;
                        break;
                    case 'month':
                        this.interval = 1440;
                        this.intervalCount = 31;
                        break;
                    case 'year':
                        this.interval = 1440;
                        this.intervalCount = 100;
                        break;
                    default:
                        throw new Error('Wrong chart mode!');
                }
            }

        }

        return new Assets();
    };

    controller.$inject = [
        'assetsService',
        'assetsData',
        '$scope',
        'utils',
        'Base',
        'user',
        'modalManager',
        'createPoll',
        'createPromise'
    ];

    angular.module('app.wallet.assets')
        .controller('AssetsCtrl', controller);
})();

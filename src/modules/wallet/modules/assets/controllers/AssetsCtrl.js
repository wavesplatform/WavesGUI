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
     * @param {IPollCreate} createPoll
     * @param {BalanceWatcher} balanceWatcher
     * @return {Assets}
     */
    const controller = function (waves, assetsData, $scope, utils, Base, user, modalManager, createPoll,
                                 balanceWatcher) {

        const tsUtils = require('ts-utils');
        const ds = require('data-service');
        const analytics = require('@waves/event-sender');

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
                 * @type {boolean}
                 */
                this.invalid = true;
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
                 * @type {Asset[]}
                 */
                this.chartAssetList = null;
                /**
                 * @type {string}
                 */
                this.change = '0.00';
                /**
                 * @type {string}
                 */
                this.changePercent = '0.00';
                /**
                 * @type {boolean}
                 */
                this.advancedMode = false;

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
                    pinnedAssetIdList: 'pinnedAssetIdList',
                    advancedMode: 'advancedMode'
                });

                this.mirrorId = user.getSetting('baseAssetId');
                this._onChangeMode();

                this.updateGraph = createPoll(this, this._getGraphData, this._setGraphData, 15000, { $scope });

                ds.api.assets.get(this.chartAssetIdList).then(assets => {
                    this.chartAssetList = assets;
                    utils.safeApply($scope);
                });

                balanceWatcher.ready.then(() => {
                    this.receive(balanceWatcher.change, this._updateBalances, this);
                    this._updateBalances();
                });

                this.observe('chartMode', this._onChangeMode);
                this.observe('_startDate', this._onChangeInterval);
                this.observe('pinnedAssetIdList', this._updateBalances);

                this.observe(['interval', 'intervalCount', 'activeChartAssetId'], this._onChangeInterval);

                this.chartOptions =
                    {
                        axisX: 'timestamp',
                        axisY: 'rate',
                        lineWidth: 4,
                        marginBottom: 46,
                        hasMouseEvents: true,
                        hasDates: true,
                        checkWidth: 2000,
                        heightFactor: 0.7,
                        view: [
                            {
                                lineColor: '#1f5af6',
                                fillColor: '#FFF',
                                gradientColor: ['#EAF0FE', '#FFF']
                            }
                        ]
                    };
            }

            openScriptModal() {
                return modalManager.showScriptModal();
            }

            openAnyTxModal() {
                return modalManager.showAnyTx(null);
            }

            abs(num) {
                return Math.abs(num);
            }

            onAssetActionClick(event, asset, action) {
                event.preventDefault();
                if (action === 'send') {
                    return this.showSend(asset);
                }

                if (action === 'info') {
                    return this.showAsset(asset);
                }

                if (action === 'receive') {
                    return this.showReceivePopup(asset);
                }

                throw new Error('Wrong action');
            }

            /**
             * @param {Asset} asset
             */
            unpin(asset) {
                analytics.send({ name: 'Wallet Assets Unpin', params: { Currency: asset.id }, target: 'ui' });
                this.pinnedAssetIdList = this.pinnedAssetIdList.filter((fAsset) => fAsset !== asset.id);
            }

            newAssetOnClick() {
                modalManager.showPinAsset().then(({ selected }) => {
                    if (selected) {
                        $scope.$digest();
                    }
                });
            }

            showReceivePopup(asset) {
                analytics.send({
                    name: 'Wallet Assets Receive Click',
                    params: { Currency: asset ? asset.id : 'All' },
                    target: 'ui'
                });
                return modalManager.showReceiveModal(user, asset);
            }

            showSeedBackupModals() {
                return modalManager.showSeedBackupModal();
            }

            /**
             * @param {Asset} asset
             */
            showAsset(asset) {
                return modalManager.showAssetInfo(asset);
            }

            /**
             * @param {Asset} asset
             */
            showSend(asset) {
                analytics.send({
                    name: 'Wallet Assets Send Click',
                    params: { Currency: asset ? asset.id : 'All' },
                    target: 'ui'
                });
                return modalManager.showSendAsset({ assetId: asset && asset.id || null });
            }

            /**
             * @param {Asset} asset
             */
            showDeposit(asset) {
                return modalManager.showDepositAsset(user, asset);
            }

            /**
             * @param {Asset} asset
             */
            showSepa(asset) {
                return modalManager.showSepaAsset(user, asset);
            }

            onMouse(chartData) {
                this.chartEvent = chartData;
                $scope.$apply();
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

            /**
             * @private
             */
            _updateBalances() {
                const hash = utils.toHash(balanceWatcher.getFullBalanceList(), 'asset.id');
                const balances = this.pinnedAssetIdList.reduce((acc, assetId) => {
                    return acc.then(list => {
                        if (hash[assetId]) {
                            list.push(hash[assetId]);
                            return list;
                        }
                        return balanceWatcher.getFullBalanceByAssetId(assetId).then(balance => {
                            list.push(balance);
                            return list;
                        });
                    });
                }, Promise.resolve([]));

                balances.then(list => {
                    this.pinnedAssetBalances = list;
                    utils.safeApply($scope);
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
                return waves.utils.getRateHistory(from, to, this._startDate);
            }

            /**
             * @param data
             * @private
             */
            _setGraphData(data) {
                this.data = [data];
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
        'createPoll',
        'balanceWatcher'
    ];

    angular.module('app.wallet.assets')
        .controller('AssetsCtrl', controller);
})();

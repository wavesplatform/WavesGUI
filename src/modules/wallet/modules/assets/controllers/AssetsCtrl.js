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
    const controller = function (waves, assetsData, $scope, utils, Base,
                                 user, modalManager, createPoll, balanceWatcher) {

        const { date } = require('ts-utils');
        const ds = require('data-service');
        const analytics = require('@waves/event-sender');


        /**
         * @class Assets
         * @extends Base
         */
        class Assets extends Base {


            /**
             * @type {string[]}
             */
            pinnedAssetIdList = null;
            /**
             * @type {Money[]}
             */
            pinnedAssetBalances = null;

            chartMode = null;
            total = null;

            interval = null;
            intervalCount = null;

            data = null;
            options = assetsData.getGraphOptions();
            mirrorId = null;

            /**
             * @type {boolean}
             */
            invalid = true;
            /**
             * @type {Moment}
             * @private
             */
            _startDate = null;
            /**
             * @type {string}
             */
            activeChartAssetId = null;
            /**
             * @type {Money}
             */
            activeChartBalance = null;
            /**
             * @type {string[]}
             */
            chartAssetIdList = null;
            /**
             * @type {Asset[]}
             */
            chartAssetList = null;
            /**
             * @type {string}
             */
            change = '0.00';
            /**
             * @type {string}
             */
            changePercent = '0.00';
            /**
             * @type {boolean}
             */
            advancedMode = false;
            /**
             * @type {string}
             */
            theme = 'default';

            dateToHours = date('hh:mm');
            dateToDates = date('DD/MM');

            constructor() {
                super($scope);

                this.options.axes.x.tickFormat = (date) => {
                    if (this.chartMode === 'hour' || this.chartMode === 'day') {
                        return this.dateToHours(date);
                    } else {
                        return this.dateToDates(date);
                    }
                };

                this.observe('activeChartAssetId', this._onChangeChartAssetId);

                this.syncSettings({
                    activeChartAssetId: 'wallet.assets.activeChartAssetId',
                    chartAssetIdList: 'wallet.assets.chartAssetIdList',
                    chartMode: 'wallet.assets.chartMode',
                    pinnedAssetIdList: 'pinnedAssetIdList',
                    advancedMode: 'advancedMode',
                    theme: 'theme'
                });

                this.mirrorId = user.getSetting('baseAssetId');
                this._onChangeMode();

                this.updateGraph = createPoll(this, this._getGraphData, 'data', 15000, { $scope });

                this.theme = user.getSetting('theme');
                this._setChartOptions();

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
                this.observe('theme', this._onThemeChange);
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
                return modalManager.showReceiveModal(asset);
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
                const id = chartData.id;
                const { xValue, yValue } = chartData.point;

                const date = new Date(xValue.toNumber());
                this.chartEvent = {
                    ...chartData,
                    id,
                    price: yValue.toFormat(2),
                    date: Assets._localDate(date, true),
                    time: this.dateToHours(date)
                };
                utils.safeApply($scope);
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
                return waves.utils.getRateHistory(from, to, this._startDate)
                    .then(data => {
                        return ({
                            rate: data
                        });
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

            /**
             * @private
             */
            _onThemeChange() {
                utils.wait(1000).then(() => this._setChartOptions());
            }

            /**
             * @private
             */
            _setChartOptions() {
                this.chartOptions =
                    {
                        axisX: 'timestamp',
                        axisY: 'rate',
                        marginBottom: 46,
                        hasDates: true,
                        checkWidth: 2000,
                        heightFactor: 0.7,
                        view: {
                            rate: this._getViewOptions()
                        }
                    };
            }

            /**
             * @return {{fillColor: string, gradientColor: string[], lineColor: string}}
             * @private
             */
            _getViewOptions() {
                switch (this.theme) {
                    case 'black':
                        return ({
                            lineColor: '#5a81ea',
                            fillColor: '#2d2d2d',
                            gradientColor: ['#334375', '#2d2d2d'],
                            lineWidth: 4
                        });
                    default:
                        return ({
                            lineColor: '#1f5af6',
                            fillColor: '#fff',
                            gradientColor: ['#eaf0fe', '#fff'],
                            lineWidth: 4
                        });
                }
            }

            /**
             * @param date @type {Date}
             * @param hasYear @type {boolean}
             * @return {string}
             * @private
             */
            static _localDate(date, hasYear = false) {
                return hasYear ? tsUtils.date('DD.MM.YYYY')(date) : tsUtils.date('DD.MM')(date);
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

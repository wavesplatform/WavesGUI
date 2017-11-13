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

                const hours = tsUtils.date('hh:mm');
                const dates = tsUtils.date('DD/MM');
                this.options.axes.x.tickFormat = (date) => {
                    if (this.chartMode === 'hour' || this.chartMode === 'day') {
                        return hours(date);
                    } else {
                        return dates(date);
                    }
                };

                createPromise(this, utils.whenAll([
                    this.syncSettings('wallet.assets.chartMode'),
                    this.syncSettings('wallet.assets.assetList')
                ]))
                    .then(() => {
                        this._onChangeMode();

                        this.updateGraph = createPoll(this, this._getGraphData, 'data', 15000);

                        createPoll(this, this._getBalances, 'assets', 5000, { isBalance: true });

                        this.observe('chartMode', () => this._onChangeMode());
                        this.observe(['interval', 'intervalCount'], () => this._onChangeInterval());
                    });
            }

            onAssetClick(event, asset, action) {
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
             * @return {Promise}
             * @private
             */
            _getBalances() {
                return assetsService.getBalanceList(this.assetList);
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
                const from = WavesApp.defaultAssets.WAVES;
                const to = WavesApp.defaultAssets.USD;
                console.log(`Chart mode: ${this.chartMode}, interval: ${this.interval}, count: ${this.intervalCount}`);
                return assetsService.getRateHistory(from, to, this.interval, this.intervalCount)
                    .then((values) => ({ values }));
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

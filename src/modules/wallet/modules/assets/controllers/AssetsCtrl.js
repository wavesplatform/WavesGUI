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

                this.data = null;
                this.assetList = null;
                this.options = assetsData.getGraphOptions();

                const hours = tsUtils.date('hh:mm');
                const dates = tsUtils.date('DD/MM');
                this.options.axes.x.tickFormat = (date) => {
                    if (this.chartMode === 'hour') {
                        return hours(date);
                    } else {
                        return dates(date);
                    }
                };

                createPromise(this, utils.whenAll([
                    this.syncSettings('wallet.assets.chartMode'),
                    this.syncSettings('wallet.assets.assetList')
                ])).then(() => {
                    this.updateGraph = createPoll(this, this._getGraphData, 'data', 5000);
                    this.updateBalances = createPoll(this, this._getBalances, 'assets', 5000, { isBalance: true });

                    this.observe('chartMode', () => this._onChangeMode());
                    this.observe(['startDate', 'endDate'], () => this._onChangeInterval());

                    this._onChangeMode();
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
                return assetsData.getGraphData(this.startDate, this.endDate).then((values) => ({ values }));
            }

            /**
             * @private
             */
            _onChangeMode() {
                switch (this.chartMode) {
                    case 'hour':
                        this.startDate = utils.moment()
                            .add()
                            .hour(-1);
                        break;
                    case 'day':
                        this.startDate = utils.moment()
                            .add()
                            .day(-1);
                        break;
                    case 'week':
                        this.startDate = utils.moment()
                            .add()
                            .week(-1);
                        break;
                    case 'month':
                        this.startDate = utils.moment()
                            .add()
                            .month(-1);
                        break;
                    case 'year':
                        this.startDate = utils.moment()
                            .add()
                            .year(-1);
                        break;
                    default:
                        throw new Error('Wrong chart mode!');
                }
                this.endDate = utils.moment();
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

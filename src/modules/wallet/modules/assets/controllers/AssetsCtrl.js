(function () {
    'use strict';

    /**
     * @param {AssetsService} assetsService
     * @param {AssetsData} assetsData
     * @param {$rootScope.Scope} $scope
     * @param {app.utils} utils
     * @param {Base} Base
     * @param {User} user
     * @param {EventManager} eventManager
     * @param {ModalManager} modalManager
     * @returns {Assets}
     */
    const controller = function (assetsService, assetsData, $scope, utils, Base, user, eventManager, modalManager) {

        class Assets extends Base {

            constructor() {
                super($scope);
                window.c = this;

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

                this.receive(eventManager.signals.balanceEventEnd, () => {
                    this.updateBalances.restart();
                });

                utils.whenAll([
                    this.syncSettings('wallet.assets.chartMode'),
                    this.syncSettings('wallet.assets.assetList')
                ]).then(this.wrapCallback(() => {
                    this.updateGraph = this.createPoll(this._getGraphData, 'data', 5000);
                    this.updateBalances = this.createPoll(this._getBalances, 'assets', 5000);

                    this.observe('chartMode', () => this._onChangeMode());
                    this.observe(['startDate', 'endDate'], () => this._onChangeInterval());
                }));
            }

            onAssetClick(event, asset, action) {
                event.preventDefault();
                switch (action) {
                    case 'send':
                        this._showSendModal(asset);
                        break;
                    case 'receive':
                        this._showReceiveModal(asset);
                        break;
                    default:
                        throw new Error('Wrong action');
                }
            }

            /**
             * @returns {Promise}
             * @private
             */
            _getBalances() {
                return assetsService.getBalanceList(this.assetList);
            }

            /**
             * @param asset
             * @private
             */
            _showSendModal(asset) {
                return this._pausePoll(modalManager.showSendAsset(asset.id, user)
                    .then(() => {
                        this.updateBalances.restart();
                    }));
            }

            /**
             * @param asset
             * @private
             */
            _showReceiveModal(asset) {
                return this._pausePoll(modalManager.showReceiveAsset(asset));
            }

            /**
             * @param promise
             * @private
             */
            _pausePoll(promise) {
                [this.updateBalances, this.updateGraph].forEach((poll) => {
                    poll.pause(promise);
                });
                return promise;
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
        'eventManager',
        'modalManager'
    ];

    angular.module('app.wallet.assets')
        .controller('AssetsCtrl', controller);
})();

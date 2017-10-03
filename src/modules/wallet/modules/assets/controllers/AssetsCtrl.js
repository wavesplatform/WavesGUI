(function () {
    'use strict';

    /**
     * @param {Poll} Poll
     * @param {AssetsService} assetsService
     * @param {AssetsData} assetsData
     * @param {$rootScope.Scope} $scope
     * @param {app.utils} utils
     * @param $mdDialog
     * @param {Base} Base
     * @param {User} user
     * @param {EventManager} eventManager
     * @returns {Assets}
     */
    const controller = function (Poll, assetsService, assetsData, $scope, utils, $mdDialog, Base, user, eventManager) {

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

                this.receive(eventManager.signals.balanceEventEnd, () => {
                    this.polls.updateBalances.restart();
                });

                utils.whenAll([
                    this.syncSettings('wallet.assets.chartMode'),
                    this.syncSettings('wallet.assets.assetList')
                ]).then(() => {
                    this.polls.updateGraph = new Poll(
                        this._getGraphData.bind(this),
                        this._applyGraphData.bind(this),
                        5000
                    );
                    this.polls.updateBalances = new Poll(
                        this._getBalances.bind(this),
                        this._applyBalances.bind(this),
                        5000
                    );
                });

                this.observe('chartMode', () => this._onChangeMode());
                this.observe(['startDate', 'endDate'], () => this._onChangeInterval());
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
             * @param balances
             * @private
             */
            _applyBalances(balances) {
                this.assets = balances;
            }

            /**
             * @param asset
             * @private
             */
            _showSendModal(asset) {
                user.getSetting('baseAssetId')
                    .then((aliasId) => {
                        $mdDialog.show({
                            clickOutsideToClose: true,
                            escapeToClose: true,
                            locals: { assetId: asset.id, aliasId },
                            bindToController: true,
                            templateUrl: '/modules/wallet/modules/assets/templates/send.modal.html',
                            controller: 'AssetSendCtrl as $ctrl',
                            autoWrap: false,
                            multiple: true
                        })
                            .then(() => {
                                this.polls.updateBalances.restart();
                            });
                    });
            }

            /**
             * @param asset
             * @private
             */
            _showReceiveModal(asset) {
                $mdDialog.show({
                    clickOutsideToClose: true,
                    escapeToClose: true,
                    bindToController: true,
                    locals: { asset },
                    templateUrl: '/modules/wallet/modules/assets/templates/receive.modal.html',
                    controller: 'AssetReceiveCtrl as $ctrl'
                });
            }

            /**
             * @private
             */
            _onChangeInterval() {
                this.polls.updateGraph.restart();
            }

            /**
             * @return {Promise}
             * @private
             */
            _getGraphData() {
                return assetsData.getGraphData(this.startDate, this.endDate);
            }

            /**
             * @param values
             * @private
             */
            _applyGraphData(values) {
                this.data = { values };
            }

            /**
             * @private
             */
            _onChangeMode() {
                switch (this.chartMode) {
                    case 'hour':
                        this.startDate = utils.moment()
                            .add
                            .hour(-1);
                        break;
                    case 'day':
                        this.startDate = utils.moment()
                            .add
                            .day(-1);
                        break;
                    case 'week':
                        this.startDate = utils.moment()
                            .add
                            .day(-7);
                        break;
                    case 'month':
                        this.startDate = utils.moment()
                            .add
                            .month(-1);
                        break;
                    case 'year':
                        this.startDate = utils.moment()
                            .add
                            .year(-1);
                        break;
                }
                this.endDate = utils.moment();
            }

        }

        return new Assets();
    };

    controller.$inject = [
        'Poll',
        'assetsService',
        'assetsData',
        '$scope',
        'utils',
        '$mdDialog',
        'Base',
        'user',
        'eventManager'
    ];

    angular.module('app.wallet.assets')
        .controller('AssetsCtrl', controller);
})();

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

                this.mode = null;
                this.assets = null;
                this.total = null;

                this.data = { values: [{ x: 0, y: 0 }] };
                this.options = assetsData.getGraphOptions();

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

                const hours = tsUtils.date('hh:mm');
                const dates = tsUtils.date('DD/MM');
                this.options.axes.x.tickFormat = (date) => {
                    if (this.mode === 'hour') {
                        return hours(date);
                    } else {
                        return dates(date);
                    }
                };

                this.receive(eventManager.signals.balanceEventEnd, () => {
                    this.polls.updateBalances.restart();
                });

                this.syncSettings('wallet.assets.chartMode');

                this.observe('mode', () => this._onChangeMode());
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
                return user.getSetting('wallet.assets.assetList')
                    .then((list) => utils.whenAll(list.map(assetsService.getBalance)));
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
                switch (this.mode) {
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

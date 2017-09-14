(function () {
    'use strict';

    const controller = function ($timeout, assetsService, $scope, utils, $mdDialog, Base) {

        const UPDATE_INTERVAL = 2000;

        class Assets extends Base {

            constructor() {
                super();
                assetsService.getAssets()
                    .then((assets) => {
                        this.assets = assets;
                        this.total = assets.reduce((result, item) => {
                            return result + item.balance;
                        }, 0);
                    });
                this.data = { values: [{ x: 0, y: 0 }] };

                this.mode = 'week';

                this.options = assetsService.getGraphOptions();

                this.observe('mode', () => this._onChangeMode());
                this.observe(['startDate', 'endDate'], () => this._onChangeInterval());
                this._onChangeMode();
                this._initializeTimeout();

                const stop = $scope.$on('$destroy', () => {
                    if (this.timer) {
                        $timeout.cancel(this.timer);
                    }
                    stop();
                });
            }

            onAssetClick(asset, action) {
                switch (action) {
                    case 'send':
                        this._showSendModal(asset);
                        break;
                    case 'receive':
                        this._showReceiveModal(asset);
                        break;
                }
            }

            _showSendModal(asset) {
                $mdDialog.show({
                    clickOutsideToClose: true,
                    escapeToClose: true,
                    locals: { asset },
                    bindToController: true,
                    templateUrl: '/modules/wallet/modules/assets/templates/send.modal.html',
                    controller: 'AssetSendCtrl as $ctrl'
                });
            }

            _showReceiveModal(asset) {
                $mdDialog.show({
                    clickOutsideToClose: true,
                    escapeToClose: true,
                    locals: { asset },
                    bindToController: true,
                    templateUrl: '/modules/wallet/modules/assets/templates/receive.modal.html',
                    controller: 'AssetReceiveCtrl as $ctrl'
                });
            }

            _initializeTimeout() {
                this.timer = $timeout(() => {
                    this._onChangeInterval();
                    this._initializeTimeout();
                }, UPDATE_INTERVAL);
            }

            _onChangeInterval() {
                assetsService.getGraphData(this.startDate, this.endDate)
                    .then((values) => {
                        this.data = { values };
                        $scope.$apply();
                    });
            }

            _onChangeMode() {
                switch (this.mode) {
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

    controller.$inject = ['$timeout', 'wallet.assetsService', '$scope', 'utils', '$mdDialog', 'Base'];

    angular.module('app.wallet.assets')
        .controller('AssetsCtrl', controller);
})();

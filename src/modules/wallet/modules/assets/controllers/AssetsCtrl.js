(function () {
    'use strict';

    const controller = function ($timeout, assetsService, $scope, utils, $mdDialog) {

        const UPDATE_INTERVAL = 2000;

        class Assets extends utils.Base {

            constructor() {
                super();
                this.assets = assetsService.getAssets();
                this.data = { values: [{ x: 0, y: 0 }] };
                this.total = this.assets.reduce((result, item) => {
                    return result + item.balance;
                }, 0);

                this.mode = 'week';

                this.options = assetsService.getGraphOptions();

                this.observe('mode', () => this._onChangeMode());
                this.observe(['startDate', 'endDate'], () => this._onChangeInterval());
                this._onChangeMode();
                this._initializeTimeout();
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
                    templateUrl: '/modules/wallet/modules/assets/templates/assetInfo.modal.html',
                    controller: 'AssetInfoCtr as $ctrl'
                });
            }

            _showReceiveModal(asset) {

            }

            _initializeTimeout() {
                this.timer = $timeout(() => {
                    this._onChangeInterval();
                    this._initializeTimeout();
                }, UPDATE_INTERVAL);
            }

            _onChangeInterval() {
                assetsService.getGraphData(this.startDate, this.endDate).then((values) => {
                    this.data = { values };
                    $scope.$apply();
                });
            }

            _onChangeMode() {
                switch (this.mode) {
                    case 'week':
                        this.startDate = utils.moment().add.day(-7);
                        break;
                    case 'month':
                        this.startDate = utils.moment().add.month(-1);
                        break;
                    case 'year':
                        this.startDate = utils.moment().add.year(-1);
                        break;
                }
                this.endDate = utils.moment();
            }

        }

        return new Assets();
    };

    controller.$inject = ['$timeout', 'assetsService', '$scope', 'utils', '$mdDialog'];

    angular.module('app.wallet.assets').controller('AssetsCtrl', controller);
})();

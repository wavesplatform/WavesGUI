(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @param $scope
     * @param {Poll} Poll
     * @param {AssetsService} assetsService
     * @param {app.utils} utils
     * @returns {PortfolioCtrl}
     */
    const controller = function (Base, $scope, Poll, assetsService, utils) {

        class PortfolioCtrl extends Base {

            constructor() {
                super($scope);
                this.portfolio = [];
                this.selectedAll = false;
                this.portfolioUpdate = this.createPoll(this._getPortfolio, this._applyPortfolio, 3000);
            }

            $postLink() {

            }

            selectAll() {
                const selected = this.selectedAll;
                this.portfolio.forEach((item) => {
                    item.checked = selected;
                });
            }

            selectItem(asset) {
                const checked = asset.checked;
                const isAllChecked = checked && this.portfolio.every((item) => item.checked);
                if (isAllChecked) {
                    this.selectedAll = true;
                } else {
                    this.selectedAll = false;
                }
            }

            _getPortfolio() {
                return assetsService.getBalanceList(Object.values(WavesApp.defaultAssets));
            }

            _applyPortfolio(data) {
                utils.syncList(this.portfolio, data);
            }

        }

        return new PortfolioCtrl();
    };

    controller.$inject = ['Base', '$scope', 'Poll', 'assetsService', 'utils'];

    angular.module('app.wallet.portfolio').controller('PortfolioCtrl', controller);
})();

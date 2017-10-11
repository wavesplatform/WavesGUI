(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @param $scope
     * @param {AssetsService} assetsService
     * @param {app.utils} utils
     * @param {ModalManager} modalManager
     * @param {User} user
     * @param {EventManager} eventManager
     * @returns {PortfolioCtrl}
     */
    const controller = function (Base, $scope, assetsService, utils, modalManager, user, eventManager) {

        class PortfolioCtrl extends Base {

            constructor() {
                super($scope);
                this.portfolio = [];
                this.selectedAll = false;
                this.portfolioUpdate = this.createPoll(this._getPortfolio, this._applyPortfolio, 3000);

                this.receive(eventManager.signals.balanceEventEnd, this.portfolioUpdate.restart, this.portfolioUpdate);
            }

            selectAll() {
                const selected = this.selectedAll;
                this.portfolio.forEach((item) => {
                    item.checked = selected;
                });
            }

            selectItem(asset) {
                const checked = asset.checked;
                this.selectedAll = checked && this.portfolio.every((item) => item.checked);
            }

            send() {
                this.pollsPause(modalManager.showSendAsset({ user, canChooseAsset: true }));
            }

            /**
             * @return {Promise}
             * @private
             */
            _getPortfolio() {
                return assetsService.getBalanceList();
            }

            /**
             * @param data
             * @private
             */
            _applyPortfolio(data) {
                utils.syncList(this.portfolio, data);
            }

        }

        return new PortfolioCtrl();
    };

    controller.$inject = ['Base', '$scope', 'assetsService', 'utils', 'modalManager', 'user', 'eventManager'];

    angular.module('app.wallet.portfolio').controller('PortfolioCtrl', controller);
})();

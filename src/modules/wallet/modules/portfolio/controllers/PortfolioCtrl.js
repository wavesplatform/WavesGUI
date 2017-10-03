(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @param $scope
     * @param {Poll} Poll
     * @param {AssetsService} assetsService
     * @returns {PortfolioCtrl}
     */
    const controller = function (Base, $scope, Poll, assetsService) {

        class PortfolioCtrl extends Base {

            constructor() {
                super($scope);
                this.polls.portfolio = new Poll(this._getPortfolio.bind(this), this._applyPortfolio.bind(this), 3000);
            }

            $postLink() {

            }

            _getPortfolio() {
                return assetsService.getBalanceList();
            }

            _applyPortfolio(data) {
                this.portfolio = data;
            }

        }

        return new PortfolioCtrl();
    };

    controller.$inject = ['Base', '$scope', 'Poll', 'assetsService'];

    angular.module('app.wallet.portfolio').controller('PortfolioCtrl', controller);
})();

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
     * @param {Function} createPoll
     * @returns {PortfolioCtrl}
     */
    const controller = function (Base, $scope, assetsService, utils, modalManager, user, eventManager, createPoll) {

        class PortfolioCtrl extends Base {

            constructor() {
                super($scope);
                /**
                 * @type {Array}
                 */
                this.portfolio = [];
                /**
                 * @type {boolean}
                 */
                this.selectedAll = false;
                /**
                 * @type {Poll}
                 */
                this.portfolioUpdate = null;
                /**
                 * @type {string}
                 */
                this.mirrorId = null;
                /**
                 * @type {IAssetInfo}
                 */
                this.mirror = null;
                /**
                 * @type {Object}
                 * @private
                 */
                this._balancesHash = Object.create(null);

                user.getSetting('baseAssetId')
                    .then((mirrorId) => {
                        const balanceSignal = eventManager.signals.balanceEventEnd;

                        this.mirrorId = mirrorId;
                        this.portfolioUpdate = createPoll(this, this._getPortfolio, 'portfolio', 3000);
                        this.receive(balanceSignal, this.portfolioUpdate.restart, this.portfolioUpdate);

                        assetsService.getAssetInfo(this.mirrorId)
                            .then((mirror) => {
                                this.mirror = mirror;
                            });
                    });
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
                return assetsService.getBalanceList()
                    .then((assets) => {
                        assets.forEach((asset) => {
                            assetsService.getRate(asset.id, this.mirrorId)
                                .then((api) => {
                                    this._balancesHash[asset.id] = api.exchange(asset.balance);
                                    asset.mirrorBalance = this._balancesHash[asset.id];
                                });
                            asset.mirrorBalance = this._balancesHash[asset.id];
                        });
                        return assets;
                    });
            }
        }

        return new PortfolioCtrl();
    };

    controller.$inject = [
        'Base',
        '$scope',
        'assetsService',
        'utils',
        'modalManager',
        'user',
        'eventManager',
        'createPoll'
    ];

    angular.module('app.wallet.portfolio').controller('PortfolioCtrl', controller);
})();

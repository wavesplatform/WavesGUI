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
     * @param {Function} createPromise
     * @return {PortfolioCtrl}
     */
    const controller = function (Base, $scope, assetsService, utils, modalManager, user, eventManager, createPoll, createPromise) {

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
                 * @type {string[]}
                 */
                this.defaultAssetIds = null;
                /**
                 * @type {Object}
                 * @private
                 */
                this._balancesHash = Object.create(null);

                createPromise(this, utils.whenAll([
                    user.getSetting('baseAssetId'),
                    user.getSetting('wallet.assets.assetList')
                ]))
                    .then(([mirrorId, defaultAssetIds]) => {

                        this.defaultAssetIds = defaultAssetIds;
                        this.mirrorId = mirrorId;
                        createPoll(this, this._getPortfolio, 'portfolio', 3000, { isBalance: true });

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
                modalManager.showSendAsset({ user, canChooseAsset: true });
            }

            /**
             * @return {Promise}
             * @private
             */
            _getPortfolio() {
                return assetsService.getBalanceList()
                    .then((assets) => assets.length ? assets : assetsService.getBalanceList(this.defaultAssetIds))
                    .then((assets) => assets.map(this._getRate, this))
                    .then((promises) => utils.whenAll(promises));
            }

            /**
             * @param {IAssetWithBalance} asset
             * @private
             */
            _getRate(asset) {
                return assetsService.getRate(asset.id, this.mirrorId)
                    .then((api) => (asset.mirrorBalance = api.exchange(asset.balance)))
                    .then(() => asset);
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
        'createPoll',
        'createPromise'
    ];

    angular.module('app.wallet.portfolio').controller('PortfolioCtrl', controller);
})();

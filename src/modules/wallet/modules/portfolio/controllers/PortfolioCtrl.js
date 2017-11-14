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
                this.assetList = null;
                /**
                 * @type {string}
                 */
                this.wavesId = WavesApp.defaultAssets.WAVES;


                createPromise(this, utils.whenAll([
                    user.getSetting('baseAssetId'),
                    this.syncSettings('wallet.assets.assetList')
                ]))
                    .then(([mirrorId]) => {
                        this.mirrorId = mirrorId;
                        assetsService.getAssetInfo(this.mirrorId)
                            .then((mirror) => {
                                this.mirror = mirror;
                            });

                        createPoll(this, this._getPortfolio, 'portfolio', 3000, { isBalance: true });
                    });
            }

            sendModal(assetId) {
                modalManager.showSendAsset({ user, canChooseAsset: !assetId, assetId });
            }

            receiveModal() {
                modalManager.showReceiveAsset(user);
            }

            showAssetInfo(asset) {
                modalManager.showAssetInfo(asset);
            }

            abs(num) {
                return Math.abs(num)
                    .toFixed(2);
            }

            pinAsset(asset, state) {
                asset.pinned = state;

                const has = (id) => {
                    return this.assetList.indexOf(id) !== -1;
                };

                if (state) {
                    if (!has(asset.id)) {
                        const list = this.assetList.slice();
                        list.push(asset.id);
                        this.assetList = list;
                    }
                } else if (has(asset.id)) {
                    const list = this.assetList.slice();
                    list.splice(this.assetList.indexOf(asset.id), 1);
                    this.assetList = list;
                }
            }

            /**
             * @return {Promise}
             * @private
             */
            _getPortfolio() {
                return assetsService.getBalanceList() // TODO! Fix empty waves. Author Tsigel at 14/11/2017 12:43
                    .then((assets) => assets.length ? assets : assetsService.getBalanceList(this.assetList))
                    .then((assets) => assets.map(this._loadAssetData, this))
                    .then((promises) => utils.whenAll(promises));
            }

            _getChange(asset) {
                return assetsService.getChange(asset.id, this.mirrorId);
            }

            _loadAssetData(asset) {
                return this._getChange(asset)
                    .then((change) => {
                        asset.pinned = this.assetList.indexOf(asset.id) !== -1;
                        asset.change = change;
                        return asset;
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
        'createPoll',
        'createPromise'
    ];

    angular.module('app.wallet.portfolio')
        .controller('PortfolioCtrl', controller);
})();

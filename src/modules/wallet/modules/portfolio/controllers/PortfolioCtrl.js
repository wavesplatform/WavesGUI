(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @param $scope
     * @param {Waves} waves
     * @param {app.utils} utils
     * @param {ModalManager} modalManager
     * @param {User} user
     * @param {EventManager} eventManager
     * @param {Function} createPoll
     * @return {PortfolioCtrl}
     */
    const controller = function (Base, $scope, waves, utils, modalManager, user, eventManager, createPoll) {

        class PortfolioCtrl extends Base {

            constructor() {
                super($scope);
                // TODO Move pinned assets to top from assets list. Author Tsigel at 14/11/2017 14:22
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


                this.syncSettings({ assetList: 'pinnedAssetIds' });

                this.mirrorId = user.getSetting('baseAssetId');
                waves.node.assets.info(this.mirrorId)
                    .then((mirror) => {
                        this.mirror = mirror;
                    });

                createPoll(this, this._getPortfolio, 'portfolio', 3000, { isBalance: true });

            }

            showSend(assetId) {
                return modalManager.showSendAsset({ user, canChooseAsset: !assetId, assetId });
            }

            /**
             * @param [asset]
             */
            showReceive(asset) {
                return waves.node.assets.info(asset && asset.id || WavesApp.defaultAssets.WAVES)
                    .then((asset) => {
                        return modalManager.showReceiveAsset(user, asset);
                    });
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
                return waves.node.assets.userBalances()
                    .then(this._checkAssets())
                    .then((assets) => assets.map(this._loadAssetData, this))
                    .then((promises) => utils.whenAll(promises));
            }

            /**
             * @param {*} asset
             * @return {*}
             * @private
             */
            _getChange(asset) {
                return waves.utils.getChange(asset.id, this.mirrorId);
            }

            /**
             * @param {*} asset
             * @private
             */
            _loadAssetData(asset) {
                return this._getChange(asset)
                    .then((change) => {
                        asset.pinned = this.assetList.indexOf(asset.id) !== -1;
                        asset.change = change;
                        return asset;
                    });
            }

            /**
             * @return {function(*=)}
             * @private
             */
            _checkAssets() {
                return (assets) => {
                    return PortfolioCtrl._isEmptyBalance(assets) ?
                        waves.node.assets.balanceList(this.assetList) :
                        assets;
                };
            }

            /**
             * @param {Array} list
             * @return {boolean}
             * @private
             */
            static _isEmptyBalance(list) {
                return list.length === 0;
            }

        }

        return new PortfolioCtrl();
    };

    controller.$inject = [
        'Base',
        '$scope',
        'waves',
        'utils',
        'modalManager',
        'user',
        'eventManager',
        'createPoll'
    ];

    angular.module('app.wallet.portfolio')
        .controller('PortfolioCtrl', controller);
})();

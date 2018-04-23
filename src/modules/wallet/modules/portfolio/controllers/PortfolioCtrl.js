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
     * @param {IPollCreate} createPoll
     * @param {GatewayService} gatewayService
     * @return {PortfolioCtrl}
     */
    const controller = function (Base, $scope, waves, utils, modalManager, user,
                                 eventManager, createPoll, gatewayService) {

        class PortfolioCtrl extends Base {

            constructor() {
                super($scope);
                /**
                 * @type {Money[]}
                 */
                this.portfolioBalances = [];
                /**
                 * @type {string}
                 */
                this.mirrorId = null;
                /**
                 * @type {Asset}
                 */
                this.mirror = null;
                /**
                 * @type {string[]}
                 */
                this.pinned = null;
                /**
                 * @type {string}
                 */
                this.wavesId = WavesApp.defaultAssets.WAVES;
                /**
                 * @type {string}
                 */
                this.address = user.address;
                /**
                 * @type {Array<string>}
                 */
                this.spam = null;
                /**
                 * @type {Array<SmartTable.IHeaderInfo>}
                 */
                this.tableHeaders = [
                    {
                        id: 'name',
                        title: { literal: 'list.name' },
                        valuePath: 'item.asset.name',
                        sort: true,
                        search: true
                    },
                    {
                        id: 'balance',
                        title: { literal: 'list.balance' },
                        valuePath: 'item.available',
                        sort: true
                    },
                    {
                        id: 'inOrders',
                        title: { literal: 'list.inOrders' },
                        valuePath: 'item.inOrders',
                        sort: true
                    },
                    {
                        id: 'mirror',
                        title: { literal: 'list.mirror' }
                    },
                    {
                        id: 'rate',
                        title: { literal: 'list.rate' }
                    },
                    {
                        id: 'change24',
                        title: { literal: 'list.change' }
                    },
                    {
                        id: 'controls'
                    }
                ];

                this.syncSettings({
                    pinned: 'pinnedAssetIdList',
                    spam: 'wallet.portfolio.spam',
                    filter: 'wallet.portfolio.filter'
                });

                this.mirrorId = user.getSetting('baseAssetId');
                waves.node.assets.getExtendedAsset(this.mirrorId)
                    .then((mirror) => {
                        this.mirror = mirror;
                    });

                /**
                 * @type {Poll}
                 */
                this.poll = createPoll(this, this._getPortfolio, 'portfolioBalances', 1000, { isBalance: true });
            }

            /**
             * @param {Asset} asset
             */
            showAsset(asset) {
                modalManager.showAssetInfo(asset);
            }

            /**
             * @param {Asset} asset
             */
            showSend(asset) {
                return modalManager.showSendAsset(user, asset || Object.create(null));
            }

            /**
             * @param {Asset} asset
             */
            showDeposit(asset) {
                return modalManager.showDepositAsset(user, asset);
            }

            /**
             * @param {Asset} asset
             */
            showSepa(asset) {
                return modalManager.showSepaAsset(user, asset);
            }

            showQR() {
                return modalManager.showAddressQrCode(user);
            }

            showBurn(assetId) {
                return modalManager.showBurnModal(assetId);
            }

            showReissue(assetId) {
                return modalManager.showReissueModal(assetId);
            }

            /**
             * @param {Asset} asset
             */
            getSrefParams(asset) {
                if (asset.id === WavesApp.defaultAssets.WAVES) {
                    return { assetId1: asset.id, assetId2: WavesApp.defaultAssets.BTC };
                } else {
                    return { assetId1: asset.id, assetId2: WavesApp.defaultAssets.WAVES };
                }
            }

            /**
             * @param {Asset} asset
             * @param {boolean} state
             */
            pinAsset(asset, state) {
                user.togglePinAsset(asset.id, state);
                this.poll.restart();
            }

            /**
             * @param {Asset} asset
             * @param {boolean} state
             */
            toggleSpam(asset, state) {
                user.toggleArrayUserSetting('wallet.portfolio.spam', asset.id, state);
                this.poll.restart();
            }

            isDepositSupported(asset) {
                return gatewayService.hasSupportOf(asset, 'deposit');
            }

            isSepaSupported(asset) {
                return gatewayService.hasSupportOf(asset, 'sepa');
            }

            /**
             * @return {Promise<Money[]>}
             * @private
             */
            _getPortfolio() {
                // TODO : request both userBalances() and balanceList(this.pinnedAssetIdList) @xenohunter
                // TODO : move pinned assets to top from assets list @tsigel
                const remapBalances = (item) => {
                    item.pinned = this._isPinned(item.asset.id);
                    return item;
                };

                switch (this.filter) {
                    case 'active':
                        return waves.node.assets.userBalances()
                            .then((list) => list.filter((item) => !this.spam.includes(item.asset.id)))
                            .then((list) => list.map(remapBalances));
                    case 'favorites':
                        return waves.node.assets.balanceList(this.pinned)
                            .then((list) => list.map(remapBalances));
                    case 'spam':
                        return waves.node.assets.balanceList(this.spam)
                            .then((list) => list.map(remapBalances));
                    default:
                        throw new Error('Wrong filter type!');
                }
            }

            /**
             * @return {function(*=)}
             * @private
             */
            _checkAssets() {
                return (assets) => {
                    return PortfolioCtrl._isEmptyBalance(assets) ?
                        waves.node.assets.balanceList(this.pinned) :
                        assets;
                };
            }

            _isPinned(assetId) {
                return this.pinned.indexOf(assetId) !== -1;
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
        'createPoll',
        'gatewayService'
    ];

    angular.module('app.wallet.portfolio')
        .controller('PortfolioCtrl', controller);
})();

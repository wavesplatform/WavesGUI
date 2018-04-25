(function () {
    'use strict';

    /**
     * @param {Base} Base
     * @param {$rootScope.Scope} $scope
     * @param {Waves} waves
     * @param {app.utils} utils
     * @param {ModalManager} modalManager
     * @param {User} user
     * @param {EventManager} eventManager
     * @param {IPollCreate} createPoll
     * @param {GatewayService} gatewayService
     * @param {$state} $state
     * @return {PortfolioCtrl}
     */
    const controller = function (Base, $scope, waves, utils, modalManager, user,
                                 eventManager, createPoll, gatewayService, $state) {

        class PortfolioCtrl extends Base {

            constructor() {
                super($scope);
                /**
                 * @type {string}
                 */
                this.mirrorId = user.getSetting('baseAssetId');
                /**
                 * @type {Asset}
                 */
                this.mirror = null;
                /**
                 * @type {string[]}
                 */
                this.pinned = [];
                /**
                 * @type {string}
                 */
                this.address = user.address;
                /**
                 * @type {Array<string>}
                 */
                this.spam = [];
                /**
                 * @type {PortfolioCtrl.IBalances}
                 */
                this.details = null;
                /**
                 * @type {Array<PortfolioCtrl.IPortfolioBalanceDetails>}
                 */
                this.balanceList = [];
                /**
                 * @type {string}
                 */
                this.filter = null;

                waves.node.assets.getExtendedAsset(this.mirrorId)
                    .then((mirror) => {
                        this.mirror = mirror;
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
                                title: { literal: 'list.mirror', params: { currency: mirror.displayName } }
                            },
                            {
                                id: 'rate',
                                title: { literal: 'list.rate', params: { currency: mirror.displayName } }
                            },
                            {
                                id: 'change24',
                                title: { literal: 'list.change' }
                            },
                            {
                                id: 'controls'
                            }
                        ];

                        $scope.$digest();
                    });

                this.syncSettings({
                    pinned: 'pinnedAssetIdList',
                    spam: 'wallet.portfolio.spam',
                    filter: 'wallet.portfolio.filter'
                });

                /**
                 * @type {Poll}
                 */
                this.poll = createPoll(this, this._getPortfolio, 'details', 1000, { isBalance: true });

                this.observe('details', this._onChangeDetails);
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
            openDex(asset) {
                $state.go('main.dex', this.getSrefParams(asset));
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
            togglePin(asset, state) {
                user.togglePinAsset(asset.id, state);
                this.poll.restart();
            }

            /**
             * @param {Asset} asset
             * @param {boolean} state
             */
            toggleSpam(asset, state) {
                user.toggleSpamAsset(asset.id, state);
                this.poll.restart();
            }

            isDepositSupported(asset) {
                return gatewayService.hasSupportOf(asset, 'deposit');
            }

            isSepaSupported(asset) {
                return gatewayService.hasSupportOf(asset, 'sepa');
            }

            /**
             * @private
             */
            _onChangeDetails() {
                const details = this.details;
                let balanceList;

                switch (this.filter) {
                    case 'active':
                        balanceList = details.active.slice();
                        break;
                    case 'pinned':
                        balanceList = details.pinned.slice();
                        break;
                    case 'spam':
                        balanceList = details.spam.slice();
                        break;
                    default:
                        throw new Error('Wrong filter name!');
                }

                this.balanceList = balanceList;
            }

            /**
             * @return {Promise<Money[]>}
             * @private
             */
            _getPortfolio() {
                /**
                 * @param {IBalanceDetails} item
                 * @return {PortfolioCtrl.IPortfolioBalanceDetails}
                 */
                const remapBalances = (item) => {
                    const isPinned = this._isPinned(item.asset.id);
                    const isSpam = this._isSpam(item.asset.id);

                    return {
                        available: item.available,
                        asset: item.asset,
                        inOrders: item.inOrders,
                        isPinned,
                        isSpam
                    };
                };

                return Promise.all([
                    waves.node.assets.userBalances().then((list) => list.map(remapBalances))
                        .then((list) => list.filter((item) => !item.isSpam)),
                    // waves.node.assets.balanceList(this.pinned).then((list) => list.map(remapBalances)),
                    waves.node.assets.balanceList(this.spam).then((list) => list.map(remapBalances))
                ]).then(([activeList, /* pinned,*/ spam]) => {
                    // const pinnedHash = utils.toHash(pinned, 'asset.id');
                    // const active = pinned.concat(activeList.filter((item) => !pinnedHash[item.asset.id]));
                    return { active: activeList, /* pinned, */ spam };
                });
            }

            /**
             * @param assetId
             * @return {boolean}
             * @private
             */
            _isPinned(assetId) {
                return this.pinned.includes(assetId);
            }

            /**
             * @param assetId
             * @return {boolean}
             * @private
             */
            _isSpam(assetId) {
                return this.spam.includes(assetId);
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
        'gatewayService',
        '$state'
    ];

    angular.module('app.wallet.portfolio')
        .controller('PortfolioCtrl', controller);
})();

/**
 * @name PortfolioCtrl
 */

/**
 * @typedef {object} PortfolioCtrl#IPortfolioBalanceDetails
 * @property {boolean} isPinned
 * @property {boolean} isSpam
 * @property {Asset} asset
 * @property {Money} available
 * @property {Money} inOrders
 */

/**
 * @typedef {object} PortfolioCtrl#IBalances
 * @property {Array<PortfolioCtrl.IPortfolioBalanceDetails>} active
 * @property {Array<PortfolioCtrl.IPortfolioBalanceDetails>} pinned // TODO when available assets store
 * @property {Array<PortfolioCtrl.IPortfolioBalanceDetails>} spam
 */

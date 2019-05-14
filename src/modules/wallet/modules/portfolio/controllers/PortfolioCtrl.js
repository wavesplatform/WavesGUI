(function () {
    'use strict';

    const { get } = require('ts-utils');

    const searchByNameAndId = ($scope, key, list) => {
        const query = $scope[key];
        if (!query) {
            return list;
        }

        return list.filter((item) => {
            const name = get({ item }, 'item.asset.name');
            const id = get({ item }, 'item.asset.id');
            return String(name).toLowerCase().indexOf(query.toLowerCase()) !== -1 || String(id) === query;
        });
    };

    const ds = require('data-service');

    /**
     * @param {Base} Base
     * @param {$rootScope.Scope} $scope
     * @param {Waves} waves
     * @param {app.utils} utils
     * @param {ModalManager} modalManager
     * @param {User} user
     * @param {EventManager} eventManager
     * @param {GatewayService} gatewayService
     * @param {$state} $state
     * @param {STService} stService
     * @param {VisibleService} visibleService
     * @param {BalanceWatcher} balanceWatcher
     * @return {PortfolioCtrl}
     */
    const controller = function (Base, $scope, waves, utils, modalManager, user,
                                 eventManager, gatewayService, $state,
                                 stService, visibleService, balanceWatcher) {

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
                /**
                 * @type {Moment}
                 */
                this.chartStartDate = utils.moment().add().day(-7);
                /**
                 * @type {boolean}
                 */
                this.pending = true;

                waves.node.assets.getAsset(this.mirrorId)
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
                                search: searchByNameAndId,
                                placeholder: 'portfolio.filter'
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

                balanceWatcher.ready
                    .then(() => {
                        const onChange = () => {
                            this._updateBalances();
                            visibleService.updateSort();
                        };

                        this.receive(balanceWatcher.change, onChange);
                        this.receive(utils.observe(user, 'scam'), onChange);
                        this.observe(['pinned', 'spam'], onChange);

                        this._updateBalances();
                    });

                balanceWatcher.ready.then(() => {
                    this.pending = false;
                    this.observe('details', this._onChangeDetails);
                    this.observe('filter', this._onChangeDetails);

                    this._onChangeDetails();
                    utils.safeApply($scope);
                });

                this.receive(stService.sort, () => {
                    visibleService.updateSort();
                });
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
                return modalManager.showSendAsset({ assetId: asset && asset.id });
            }

            /**
             * @param {Asset} asset
             */
            showReceivePopup(asset) {
                return modalManager.showReceiveModal(user, asset);
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

            showBurn(assetId) {
                return modalManager.showBurnModal(assetId);
            }

            showReissue(assetId) {
                return modalManager.showReissueModal(assetId);
            }

            canShowDex(balance) {
                return balance.isPinned ||
                    balance.asset.isMyAsset ||
                    balance.asset.id === WavesApp.defaultAssets.WAVES ||
                    gatewayService.getPurchasableWithCards()[balance.asset.id] ||
                    gatewayService.getCryptocurrencies()[balance.asset.id] ||
                    gatewayService.getFiats()[balance.asset.id];
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
                utils.openDex(asset.id);
            }

            /**
             * @param {Asset} asset
             * @param {boolean} [state]
             */
            togglePin(asset, state) {
                user.togglePinAsset(asset.id, state);
                this.poll.restart();
            }

            /**
             * @param {Asset} asset
             * @param {boolean} [state]
             */
            toggleSpam(asset, state) {
                user.toggleSpamAsset(asset.id, state);
                this.poll.restart();
            }

            isDepositSupported(asset) {
                const isWaves = asset.id === WavesApp.defaultAssets.WAVES;

                return gatewayService.hasSupportOf(asset, 'deposit') || isWaves;
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
                    case 'my':
                        balanceList = details.my.slice();
                        break;
                    case 'verified':
                        balanceList = details.verified.slice();
                        break;
                    default:
                        throw new Error('Wrong filter name!');
                }

                this.balanceList = balanceList;
            }

            /**
             * @private
             */
            _updateBalances() {
                const details = balanceWatcher.getFullBalanceList()
                    .map(item => {
                        const isPinned = this._isPinned(item.asset.id);
                        const isSpam = this._isSpam(item.asset.id);
                        const isOnScamList = user.scam[item.asset.id];

                        return {
                            available: item.available,
                            asset: item.asset,
                            inOrders: item.inOrders,
                            isPinned,
                            isSpam,
                            isOnScamList,
                            minSponsoredAssetFee: item.asset.minSponsoredAssetFee,
                            sponsorBalance: item.asset.sponsorBalance
                        };
                    })
                    .reduce((acc, item) => {
                        const oracleData = ds.dataManager.getOraclesAssetData(item.asset.id);

                        if (item.asset.sender === user.address) {
                            acc.my.push(item);
                        }
                        if (oracleData && oracleData.status > 0) {
                            acc.verified.push(item);
                        }
                        if (item.isOnScamList || item.isSpam) {
                            acc.spam.push(item);
                        } else {
                            acc.active.push(item);
                        }

                        return acc;
                    }, { spam: [], my: [], active: [], verified: [] });

                this.details = details;
                utils.safeApply($scope);
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
        'gatewayService',
        '$state',
        'stService',
        'visibleService',
        'balanceWatcher'
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
 * @property {boolean} isOnScamList
 * @property {Asset} asset
 * @property {Money} available
 * @property {Money} inOrders
 * @property {Money|void} minSponsoredAssetFee
 * @property {Money|void} sponsorBalance
 */

/**
 * @typedef {object} PortfolioCtrl#IBalances
 * @property {Array<PortfolioCtrl.IPortfolioBalanceDetails>} active
 * @property {Array<PortfolioCtrl.IPortfolioBalanceDetails>} pinned // TODO when available assets store
 * @property {Array<PortfolioCtrl.IPortfolioBalanceDetails>} spam
 * @property {Array<PortfolioCtrl.IPortfolioBalanceDetails>} my
 * @property {Array<PortfolioCtrl.IPortfolioBalanceDetails>} verified
 */

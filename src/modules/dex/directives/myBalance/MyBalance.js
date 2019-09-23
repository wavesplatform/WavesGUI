(function () {
    'use strict';

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {User} user
     * @param {ModalManager} modalManager
     * @param {BalanceWatcher} balanceWatcher
     * @param {app.utils} utils
     * @param {STService} stService
     * @param {VisibleService} visibleService
     * @return {MyBalance}
     */
    const controller = function (Base, $scope, user, modalManager, balanceWatcher, utils, stService, visibleService) {

        class MyBalance extends Base {

            /**
             * @type {Array<Money>}
             */
            balanceList = [];
            /**
             * @type {boolean}
             */
            isDemo = !user.address;
            /**
             * @type {boolean}
             */
            pending = !!user.address;
            /**
             * @type {*[]}
             */
            headers = [
                {
                    id: 'asset',
                    search: (key, value, list) => {
                        const serchValue = (key[value] || '').trim();
                        const serachTxt = serchValue.toLowerCase();

                        if (!serachTxt) {
                            return list;
                        }

                        return list.filter(item => {
                            if (item.asset.id === serchValue) {
                                return true;
                            }

                            const name = (
                                (item.asset.ticker || '') +
                                (item.asset.name || '')
                            ).toLowerCase();

                            return name.includes(serachTxt);
                        });
                    },
                    sort: true,
                    placeholder: 'directives.filter',
                    valuePath: 'item.asset.displayName'
                },
                {
                    id: 'assetId',
                    sort: false,
                    title: { literal: 'directives.balance.assetId' },
                    valuePath: 'item.assetId'
                },
                {
                    id: 'available',
                    sort: true,
                    title: { literal: 'directives.balance.available' },
                    valuePath: 'item.available'
                },
                {
                    id: 'inOrders',
                    sort: true,
                    title: { literal: 'directives.balance.inOrdersFull' },
                    valuePath: 'item.inOrders'
                },
                {
                    id: 'total',
                    sort: true,
                    title: { literal: 'directives.balance.total' },
                    valuePath: 'item.regular'
                }
            ];

            /**
             * @type {Array}
             */
            userList = [];

            constructor() {
                super();

                this.syncSettings({
                    _assetIdPair: 'dex.assetIdPair'
                });

                if (!this.isDemo) {

                    this.balanceList = MyBalance._getBalanceList();
                    this.receive(balanceWatcher.change, this._onChangeBalance, this);
                    this.pending = true;

                    utils.when(balanceWatcher.ready).then(() => {
                        this.pending = false;
                    });

                }

                user.getMultiAccountUsers().then(list => {
                    this.userList = list;
                });

                this.receive(stService.draw, this._updateVisible, this);
            }

            static _getBalanceList() {
                return balanceWatcher.getFullBalanceList().filter(MyBalance._isNotScam());
            }

            /**
             * @private
             */
            static _isNotScam() {
                const spamHash = (user.getSetting('wallet.portfolio.spam') || [])
                    .reduce((r, id) => {
                        r[id] = true;
                        return r;
                    }, Object.create(null));
                return item => !user.scam[item.asset.id] && !spamHash[item.asset.id];
            }

            showAssetInfo(asset) {
                return modalManager.showAssetInfo(asset);
            }

            /**
             * @param {Asset} asset
             * @return boolean
             */
            isSelected(asset) {
                return this._assetIdPair.amount === asset.id ||
                    this._assetIdPair.price === asset.id;
            }

            /**
             * @public
             * @param assetID
             */
            isLockedPair(assetID) {
                return utils.isLockedInDex(assetID);
            }

            /**
             * @param {string} assetId
             */
            setPair(assetId) {
                if (this.isLockedPair(assetId)) {
                    return null;
                }
                const wavesId = WavesApp.defaultAssets.WAVES;
                const btcId = WavesApp.defaultAssets.BTC;
                const assetId2 = assetId === wavesId ? btcId : wavesId;

                ds.api.pairs.get(assetId, assetId2).then((pair) => {
                    user.setSetting('dex.assetIdPair', {
                        amount: pair.amountAsset.id,
                        price: pair.priceAsset.id
                    });
                });
            }

            /**
             * @private
             * @param {string} name
             */
            _updateVisible(name) {
                if (name === 'balanceList') {
                    visibleService.updateSort();
                }
            }

            /**
             * @private
             */
            _onChangeBalance() {
                this.balanceList = MyBalance._getBalanceList();
                $scope.$apply();
            }

        }

        return new MyBalance();
    };

    controller.$inject = [
        'Base',
        '$scope',
        'user',
        'modalManager',
        'balanceWatcher',
        'utils',
        'stService',
        'visibleService'
    ];

    angular.module('app.dex').component('wDexMyBalance', {
        bindings: {},
        templateUrl: 'modules/dex/directives/myBalance/myBalance.html',
        transclude: false,
        controller
    });
})();

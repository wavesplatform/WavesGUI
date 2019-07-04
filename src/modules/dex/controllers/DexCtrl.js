(function () {
    'use strict';

    const ds = require('data-service');

    /**
     * @param {Base} Base
     * @param {JQuery} $element
     * @param {$state} $state
     * @param {$location} $location
     * @param {User} user
     * @param {$rootScope.Scope} $scope
     * @param {IPollCreate} createPoll
     * @param {Waves} waves
     * @param {utils} utils
     * @param {ModalManager} modalManager
     * // TODO: delete after contest
     * @param {PermissionManager} permissionManager
     * // TODO: delete after contest
     * @return {DexCtrl}
     */
    const controller = function (Base,
                                 $element,
                                 $state,
                                 $location,
                                 user,
                                 $scope,
                                 createPoll,
                                 waves,
                                 modalManager,
                                 permissionManager,
                                 utils) {

        const analytics = require('@waves/event-sender');

        const ANALYTICS_TABS_NAMES = {
            myOpenOrders: 'My Open Orders',
            myTradeHistory: 'My Trade History',
            tradeHistory: 'Trade History',
            myBalance: 'My Balance'
        };

        class DexCtrl extends Base {

            /**
             * @type {string}
             */
            _titleTxt;

            constructor() {
                super($scope);
                /**
                 * @type {boolean}
                 */
                this.ready = false;
                /**
                 * @type {boolean}
                 */
                this.isLogined = !!user.address;
                /**
                 * @type {boolean}
                 * @private
                 */
                this._leftHidden = false;
                /**
                 * @type {boolean}
                 * @private
                 */
                this._rightHidden = false;
                /**
                 * @type {{price: string, amount: string}}
                 * @private
                 */
                this._assetIdPair = null;

                this.observe('tab', this._onChangeTab);

                this.syncSettings({
                    tab: 'dex.layout.bottomleft.tab',
                    _leftHidden: 'dex.layout.leftColumnState',
                    _rightHidden: 'dex.layout.rightColumnState',
                    _assetIdPair: 'dex.assetIdPair'
                });

                if (!this.isLogined) {
                    this.tab = 'tradeHistory';
                }

                const matcherSign = () => {
                    return user.address ? user.addMatcherSign() : Promise.resolve();
                };

                matcherSign()
                    .catch(() => Promise.resolve())
                    .then(() => {
                        this._initializePair().then(() => {
                            this.ready = true;
                            $scope.$apply();
                        });
                    });

                createPoll(this, this._getLastPrice, '_titleTxt', 1000);

                this.observe('_assetIdPair', this._onChangePair);
                this.observe('_titleTxt', this._setTitle);
                this.observe(['_leftHidden', '_rightHidden'], this._onChangeProperty);
            }

            $onDestroy() {
                super.$onDestroy();
                window.document.title = 'Waves Client';
            }

            // hide and show graph to force its resize
            toggleColumn(column) {
                this[`_${column}Hidden`] = !this[`_${column}Hidden`];
            }

            /**
             * @private
             */
            async _onChangePair() {
                const userAssetIdPair = user.getSetting('dex.assetIdPair');
                if (utils.isLockedInDex(userAssetIdPair.amount, userAssetIdPair.price)) {
                    return this._showModalAndRedirect(userAssetIdPair.amount, userAssetIdPair.price);
                }
                const pair = await this._getPair();
                $location.search('assetId2', pair.amountAsset.id);
                $location.search('assetId1', pair.priceAsset.id);
            }

            /**
             * @return {Promise}
             * @private
             */
            _showModalAndRedirect(amountAssetId, priceAssetId) {
                Promise.all([
                    waves.node.assets.getAsset(amountAssetId),
                    waves.node.assets.getAsset(priceAssetId)
                ]).then(([priceAsset, amountAsset]) => {
                    const amountAssetName = amountAsset.ticker || amountAsset.displayName;
                    const priceAssetName = priceAsset.ticker || priceAsset.displayName;

                    const findUnlocked = assetId => assetId !== 'WAVES' && !utils.isLockedInDex(assetId);

                    const unLockedAsset = utils.isLockedInDex(WavesApp.defaultAssets.BTC) ?
                        Object.values(WavesApp.defaultAssets).find(findUnlocked) :
                        WavesApp.defaultAssets.BTC;


                    user.setSetting('dex.assetIdPair', {
                        amount: WavesApp.defaultAssets.WAVES,
                        price: unLockedAsset
                    });

                    return modalManager.showLockPairWarning(amountAssetName, priceAssetName)
                        .then(() => {
                            $location.search('assetId2', WavesApp.defaultAssets.WAVES);
                            $location.search('assetId1', unLockedAsset);
                            this._initializePair();
                        });
                });
            }

            /**
             * @private
             */
            _onChangeTab() {
                if (ANALYTICS_TABS_NAMES[this.tab]) {
                    analytics.send({ name: `DEX ${ANALYTICS_TABS_NAMES[this.tab]} Show`, target: 'ui' });
                }
            }

            /**
             * @return {Promise}
             * @private
             */
            _getLastPrice() {
                return this._getPair().then(pair => {
                    const pairText = `| ${pair.amountAsset.displayName}/${pair.priceAsset.displayName}`;
                    return waves.matcher.getLastPrice(pair).then(data => {
                        const priceText = data.price.getTokens().isNaN() ? '-' : data.price.toFormat();
                        return `${priceText} ${pairText}`;
                    }, () => {
                        return `- ${pairText}`;
                    });
                });
            }

            /**
             * @return {Promise}
             * @private
             */
            _initializePair() {
                return new Promise((resolve) => {
                    setTimeout(() => {
                        const urlPair = this._getPairFromState();
                        if (urlPair) {
                            return this._getPair(urlPair)
                                .catch(() => this._getPair({
                                    amount: WavesApp.defaultAssets.WAVES,
                                    price: WavesApp.defaultAssets.BTC
                                }))
                                .then(({ amountAsset, priceAsset }) => {
                                    const activeTab = user.getSetting('dex.watchlist.activeTab');
                                    const activeTabIsTrading = activeTab === 'trading';
                                    const activeTabIsTradingAndContestEnd = activeTabIsTrading &&
                                        !permissionManager.isPermitted('CONTEST_TIME');

                                    if (activeTab !== 'all' &&
                                        activeTab !== amountAsset.id &&
                                        activeTab !== priceAsset.id &&
                                        !activeTabIsTrading ||
                                        activeTabIsTradingAndContestEnd
                                    ) {
                                        user.setSetting('dex.watchlist.activeTab', 'all');
                                    }

                                    this._assetIdPair = {
                                        amount: amountAsset.id,
                                        price: priceAsset.id
                                    };
                                })
                                .then(resolve);
                        } else {
                            this._onChangePair();
                            resolve();
                        }
                    }, 200);
                });
            }

            /**
             * @private
             */
            _getPair(pair = this._assetIdPair) {
                if (pair) {
                    return ds.api.pairs.get(pair.amount, pair.price);
                } else {
                    return ds.api.pairs.get(WavesApp.defaultAssets.WAVES, WavesApp.defaultAssets.BTC);
                }
            }

            /**
             * @private
             */
            _getPairFromState() {
                if (!($state.params.assetId1 && $state.params.assetId2)) {
                    return null;
                }

                return {
                    amount: $state.params.assetId1,
                    price: $state.params.assetId2
                };
            }

            /**
             * @private
             */
            _onChangeProperty() {
                const $graphWrapper = $element.find('.graph-wrapper');
                $graphWrapper.hide();
                setTimeout(() => $graphWrapper.show(), 100);
            }

            /**
             * @private
             */
            _setTitle() {
                window.document.title = this._titleTxt;
            }

        }

        return new DexCtrl();
    };


    controller.$inject = [
        'Base',
        '$element',
        '$state',
        '$location',
        'user',
        '$scope',
        'createPoll',
        'waves',
        'modalManager',
        'permissionManager',
        'utils'
    ];

    angular.module('app.dex')
        .controller('DexCtrl', controller);
})();

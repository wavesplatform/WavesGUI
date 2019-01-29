(function () {
    'use strict';


    const DROP_DOWN_ORDER_LIST = ['ETH', 'BCH', 'LTC', 'USD', 'EUR'];
    const DROP_DOWN_LIST = [];

    DROP_DOWN_ORDER_LIST.forEach((name) => {
        DROP_DOWN_LIST.push({ name, id: WavesApp.defaultAssets[name] });
    });
    Object.keys(WavesApp.defaultAssets).forEach((name) => {
        if (!DROP_DOWN_ORDER_LIST.includes(name) && name !== 'WAVES' && name !== 'BTC') {
            DROP_DOWN_LIST.push({ name, id: WavesApp.defaultAssets[name] });
        }
    });

    /**
     * @param Base
     * @param {$rootScope.Scope} $scope
     * @param {app.utils} utils
     * @param {Waves} waves
     * @param {STService} stService
     * @param {PromiseControl} PromiseControl
     * @param {IPollCreate} createPoll
     * @param {JQuery} $element
     * @param {ModalManager} modalManager
     * @param {ConfigService} configService
     * @returns {WatchList}
     */
    const controller = function (Base, $scope, utils, waves, stService, PromiseControl, createPoll, $element,
                                 modalManager, configService) {

        const R = require('ramda');
        const ds = require('data-service');

        $scope.WavesApp = WavesApp;

        class WatchList extends Base {

            constructor() {
                super($scope);
                /**
                 * @type {boolean}
                 */
                this.pending = false;
                /**
                 * @type {null}
                 */
                this.dropDownId = null;
                /**
                 * @type {Array}
                 */
                this.dropDown = DROP_DOWN_LIST;
                /**
                 * @type {boolean}
                 */
                this.isActiveSelect = false;
                /**
                 * @type {PromiseControl}
                 */
                this.searchRequest = null;
                /**
                 * @type {[*]}
                 */
                this.tabs = [
                    { name: 'directives.watchlist.all', value: 'all' },
                    { name: 'WAVES', value: WavesApp.defaultAssets.WAVES },
                    { name: 'BTC', value: WavesApp.defaultAssets.BTC }
                ];
                /**
                 * @type {function}
                 * @private
                 */
                this._cache = utils.cache(
                    controller.storage,
                    WatchList._loadDataByPairs,
                    WatchList._getKeyByPair,
                    1000 * 30,
                    pair => list => list.find((p) => R.equals(p.pairIdList.slice().sort(), pair.slice().sort()))
                );
                /**
                 * @type {*[]}
                 */
                this.headers = [
                    {
                        id: 'favourite',
                        templatePath: 'modules/dex/directives/dexWatchlist/FavouritesColumnHeader.html',
                        scopeData: {
                            toggleOnlyFavourite: () => {
                                this.showOnlyFavorite = !this.showOnlyFavorite;
                                WatchList._renderSmartTable();
                            },
                            $ctrl: this
                        }
                    },
                    {
                        id: 'pair',
                        title: { literal: 'directives.watchlist.pair' },
                        sort: this._getComparatorByPath('pairNames')
                    },
                    {
                        id: 'price',
                        title: { literal: 'directives.watchlist.price' },
                        sort: this._getComparatorByPath('price')
                    },
                    {
                        id: 'change',
                        title: { literal: 'directives.watchlist.chg' },
                        sort: this._getComparatorByPath('change24')
                    },
                    {
                        id: 'volume',
                        title: { literal: 'directives.watchlist.volume' },
                        sortActive: true,
                        isAsc: false,
                        sort: this._getComparatorByPath('volume')
                    },
                    {
                        id: 'info'
                    }
                ];
                /**
                 * @type {SmartTable.ISmartTableOptions}
                 */
                this.tableOptions = {
                    filter: this._getTableFilter()
                };
                /**
                 * @type {string}
                 */
                this.search = '';
                /**
                 * @type {boolean}
                 */
                this.searchInProgress = false;
                /**
                 * @type {string}
                 */
                this.activeTab = 'all';
                /**
                 * @type {boolean}
                 */
                this.showOnlyFavorite = false;
                /**
                 * @type {Array<WatchList.IPairDataItem>}
                 */
                this.pairDataList = null; // TODO Remove disgusting hack
                /**
                 * @type {boolean}
                 * @private
                 */
                this._isSelfSetPair = false;
                /**
                 * @type {Array}
                 * @private
                 */
                this._searchAssets = [];
                /**
                 * @type {Object}
                 * @private
                 */
                this._searchAssetsHash = Object.create(null);
                /**
                 * @type {Array}
                 * @private
                 */
                this._assetsIds = [];
                /**
                 * @type {Array}
                 * @private
                 */
                this._favourite = [];
                /**
                 * @type {Object}
                 * @private
                 */
                this._favoriteHash = Object.create(null);
                /**
                 * @type {{amount: string, price: string}}
                 * @private
                 */
                this._assetIdPair = null;
                /**
                 * @type {Poll}
                 * @private
                 */
                this._poll = null;
            }

            $postLink() {
                this.observe('dropDownId', this._onChangeDropDown);
                this.observe('_favourite', this._updateFavoriteHash);
                this.observe('_searchAssets', this._updateSearchAssetHash);
                this.observe('search', this._onChangeSearch);

                this.syncSettings({
                    activeTab: 'dex.watchlist.activeTab',
                    showOnlyFavorite: 'dex.watchlist.showOnlyFavorite',
                    _favourite: 'dex.watchlist.favourite',
                    _assetsIds: 'dex.watchlist.list',
                    _assetIdPair: 'dex.assetIdPair'
                });

                this._initializeActiveTab();

                this.observe('_assetIdPair', this._onChangeChosenPair);
                this.observe('activeTab', this._onChangeActiveTab);

                stService.draw.once(WatchList._onRenderTable);

                this.pending = true;
                this._poll = createPoll(this, this._getPairData, 'pairDataList', 1000 * 30, { $scope });

                this._poll.ready.then(() => {
                    this.pending = false;
                });
            }

            showAssetInfo(event, asset) {
                event.preventDefault();
                event.stopPropagation();
                return modalManager.showAssetInfo(asset);
            }

            /**
             * @param {WatchList.IPairDataItem} pairData
             * @return boolean
             */
            isChosen(pairData) {
                return this._assetIdPair.amount === pairData.amountAsset.id &&
                    this._assetIdPair.price === pairData.priceAsset.id;
            }

            /**
             * @param {WatchList.IPairDataItem} pairData
             */
            choosePair(pairData) {
                const pair = {
                    amount: pairData.amountAsset.id,
                    price: pairData.priceAsset.id
                };
                this._isSelfSetPair = true;
                this._assetIdPair = pair;
                this._isSelfSetPair = false;
            }

            chooseSelect() {
                this.isActiveSelect = true;
                this.activeTab = this.dropDownId;
            }

            /**
             * @param {string} id
             */
            chooseTab(id) {
                this.isActiveSelect = false;
                this.activeTab = id;
            }

            /**
             * @param {JQueryEventObject} $event
             * @param pair
             */
            toggleFavourite($event, pair) {
                $event.stopPropagation();

                const key = WatchList._getKeyByPair(pair.pairIdList);
                const favorite = this._favourite.slice();

                if (this._favoriteHash[key]) {
                    const isEqualPair = p => R.equals(p, pair.pairIdList) || R.equals(p, pair.pairIdList.reverse());
                    const predicate = (p) => R.not(isEqualPair(p));
                    this._favourite = favorite.filter(predicate);
                } else {
                    favorite.push(pair.pairIdList);
                    this._favourite = R.uniq(favorite);
                }
                WatchList._renderSmartTable();
            }

            /**
             * @param pair
             * @returns {boolean}
             */
            isFavourite(pair) {
                return !!this._favoriteHash[WatchList._getKeyByPair(pair.pairIdList)];
            }

            /**
             * @private
             */
            _initializeActiveTab() {
                this.isActiveSelect = !R.find(R.propEq('value', this.activeTab), this.tabs);
                if (this.isActiveSelect) {
                    this.dropDownId = this.activeTab;
                }
            }

            /**
             * @private
             */
            _onChangeChosenPair() {
                const pair = this._assetIdPair;
                const id = [pair.amount, pair.price].sort().join();

                if (!this._favoriteHash[id] && this.showOnlyFavorite) {
                    this.showOnlyFavorite = false;
                }

                if (!R.find(R.propEq('id', id), this.pairDataList)) {
                    this._cache([id.split(',')]).then(([item]) => {
                        this.pairDataList.push(item);
                        WatchList._renderSmartTable();
                    });
                } else {
                    WatchList._renderSmartTable();
                }

                if (!this._isSelfSetPair) {
                    this.activeTab = 'all';
                    stService.draw.once(WatchList._onRenderTable);
                }
            }

            /**
             * @private
             */
            _onChangeDropDown() {
                if (this.isActiveSelect) {
                    this.activeTab = this.dropDownId;
                }
            }

            _getPairData() {
                const pairs = this._getPairList();
                return Promise.all([
                    this._getTabRate(),
                    this._cache(pairs)
                ])
                    .then(([rate, pairs]) => pairs.map(WatchList._addRateForPair(rate)));
            }

            _getTabRate() {
                const activeTab = this.activeTab;
                return waves.node.assets.getAsset(activeTab === 'all' ? WavesApp.defaultAssets.WAVES : activeTab)
                    .then((asset) => {
                        this.volumeAsset = asset;

                        if (activeTab === 'all') {
                            return Promise.resolve(new BigNumber(1));
                        } else {
                            return waves.utils.getRate(WavesApp.defaultAssets.WAVES, activeTab);
                        }
                    });
            }

            /**
             * @returns {function (list: Array): Array}
             * @private
             */
            _getTableFilter() {
                return list => {
                    const hasSearch = this.search !== '';
                    if (hasSearch) {
                        return list.filter((item) => {
                            return this._filterDataItemByTab(item) && this._filterDataItemByQuery(item);
                        });
                    } else {
                        return list.filter((item) => {
                            return this._filterDataItemByTab(item);
                        });
                    }
                };
            }

            /**
             * @param {WatchList.IPairDataItem} item
             * @returns {boolean}
             * @private
             */
            _filterDataItemByTab(item) {
                const canShow = this.showOnlyFavorite ? this.isFavourite(item) : true;

                switch (this.activeTab) {
                    case 'all':
                        return canShow;
                    default:
                        return canShow && (
                            item.amountAsset.id === this.activeTab ||
                            item.priceAsset.id === this.activeTab
                        );
                }
            }

            /**
             * @param {WatchList.IPairDataItem} item
             * @returns {boolean}
             * @private
             */
            _filterDataItemByQuery(item) {
                const query = this.search;

                const amountSearch = {
                    success: false,
                    names: [
                        item.amountAsset.name.toLowerCase(),
                        item.amountAsset.ticker && item.amountAsset.ticker.toLowerCase() || null
                    ].filter(Boolean)
                };

                const priceSearch = {
                    success: false,
                    names: [
                        item.priceAsset.name.toLowerCase(),
                        item.priceAsset.ticker && item.priceAsset.ticker.toLowerCase() || null
                    ].filter(Boolean)
                };

                const searchPair = [amountSearch, priceSearch];

                function search(query) {
                    const queryList = query.split('/').map(q => q.trim());

                    if (queryList.length === 1) {
                        const q = query.toLowerCase();

                        if (WatchList._isId(query)) {
                            return item.pairIdList.includes(query);
                        } else {
                            return R.filter(R.whereEq({ success: false }), searchPair).some((searchItem) => {
                                searchItem.success = searchItem.names.some(n => n.indexOf(q) === 0);
                                return searchItem.success;
                            });
                        }
                    }

                    if (queryList[0] && queryList[1] === '') {
                        const q = queryList[0].toLowerCase();

                        if (WatchList._isId(queryList[0])) {
                            return item.pairIdList.includes(queryList[0]);
                        } else {
                            return searchPair.some((searchItem) => {
                                if (!searchItem.success) {
                                    searchItem.success = searchItem.names.some(n => n === q);
                                }
                                return searchItem.success;
                            });
                        }
                    }

                    if (!queryList[0] && queryList[1]) {
                        return search(query.replace('/', ''));
                    }

                    return search(queryList[0].trim()) && search(queryList[1].trim());
                }

                return search(query.trim());
            }

            /**
             * @private
             */
            _onChangeSearch() {
                if (this.searchRequest) {
                    this.searchRequest.drop();
                    this.searchInProgress = false;
                    this.pending = false;
                    this.searchRequest = null;
                }

                const query = this.search;
                this._searchAssets = [];

                const queryParts = query.split('/')
                    .slice(0, 2)
                    .map(q => q.replace(/[:()^]/g, '').trim())
                    .filter(Boolean);

                if (!queryParts.length) {
                    WatchList._renderSmartTable();
                    return null;
                }

                this.searchInProgress = true;
                this.pending = true;

                this.searchRequest = new PromiseControl(Promise.all(queryParts.map(waves.node.assets.search)))
                    .then(([d1 = [], d2 = []]) => {
                        this._searchAssets = R.uniqBy(R.prop('id'), d1.concat(d2));
                        return this._poll.restart().then(() => {
                            this.searchInProgress = false;
                            this.pending = false;
                            this.searchRequest = null;
                            this.showOnlyFavorite = false;
                            $scope.$apply();
                        });
                    })
                    .catch(() => {
                        this.searchInProgress = false;
                        this.pending = false;
                        this.searchRequest = null;
                        $scope.$apply();
                    });
            }

            /**
             * @private
             */
            _updateFavoriteHash() {
                this._favoriteHash = this._favourite.reduce((acc, pair) => {
                    acc[WatchList._getKeyByPair(pair)] = pair;
                    return acc;
                }, Object.create(null));
            }

            _updateSearchAssetHash() {
                this._searchAssetsHash = this._searchAssets.reduce((acc, asset) => {
                    acc[asset.id] = asset;
                    return acc;
                }, Object.create(null));
            }

            /**
             * @private
             */
            _onChangeActiveTab() {
                this.pending = true;
                this._poll.restart().then(() => {
                    this.pending = false;
                    $scope.$apply();
                });
            }

            /**
             * @private
             */
            _getPairList() {
                const defaultAssets = configService.get('SETTINGS.DEX.WATCH_LIST_PAIRS') || [];
                const favorite = (this._favourite || []).map(p => p.sort());
                const chosen = [this._assetIdPair.amount, this._assetIdPair.price].sort();
                const searchIdList = Object.keys(this._searchAssetsHash);
                const idList = R.uniq(this._assetsIds.concat(searchIdList, defaultAssets));
                const other = WatchList._getAllCombinations(idList);
                return R.uniq(favorite.concat(other, [chosen]));
            }

            /**
             * @param {string} path
             * @returns {function(list: Array, isAsc: boolean): Array}
             * @private
             */
            _getComparatorByPath(path) {
                return (list, isAsc) => {
                    const method = isAsc ? 'asc' : 'desc';
                    const favorite = [];
                    const other = [];
                    const comparator = utils.comparators.process(R.path(path.split('.'))).smart[method];

                    list.forEach((item) => {
                        if (this.isFavourite(item)) {
                            favorite.push(item);
                        } else {
                            other.push(item);
                        }
                    });

                    favorite.sort(comparator);
                    other.sort(comparator);

                    return favorite.concat(other);
                };
            }

            static _addRateForPair(rate) {
                return pair => {
                    if (!pair.volume) {
                        return pair;
                    }

                    const currentVolume = pair.volume.getTokens().times(rate).dp(3, BigNumber.ROUND_HALF_UP);

                    return { ...pair, currentVolume };
                };
            }

            static _renderSmartTable() {
                stService.render('watchlist');
            }

            static _onRenderTable(name) {
                if (name !== 'watchlist') {
                    return null;
                }

                setTimeout(function loop() {
                    const $chosen = $element.find('.chosen');

                    if (!$chosen.length) {
                        return null;
                    }

                    const $body = $element.find('.smart-table__w-tbody');
                    const scroll = $body.scrollTop();
                    const chosenOffset = $chosen.offset().top;
                    const bodyOffset = $body.offset().top;

                    const top = chosenOffset - bodyOffset + scroll - $body.height() / 2 + $chosen.height() / 2;

                    $element.find('.smart-table__w-tbody').animate({
                        scrollTop: top
                    }, 300);
                }, 300);
            }

            /**
             * @param {string} query
             * @returns {boolean}
             * @private
             */
            static _isId(query) {
                return WatchList._getBytes(query) > 16 || query === 'WAVES';
            }

            /**
             * @param {string} str
             * @returns {number}
             * @private
             */
            static _getBytes(str) {
                return new Blob([str], { type: 'text/html' }).size;
            }

            static _getAssetsFromPairs(pairs) {
                return pairs.reduce((acc, item) => {
                    ['amountAsset', 'priceAsset'].forEach((propertyName) => {
                        if (!acc.hash[item.pair[propertyName].id]) {
                            acc.assets.push(item.pair[propertyName]);
                            acc.hash[item.pair[propertyName].id] = true;
                        }
                    });
                    return acc;
                }, { assets: [], hash: {} }).assets;
            }

            /**
             * @param {Array<string>} pair
             * @return string
             * @private
             */
            static _getKeyByPair(pair) {
                return pair.sort().join();
            }

            /**
             * @param pairs
             * @private
             */
            static _loadDataByPairs(pairs) {
                const ids = R.uniq(R.flatten(pairs));
                return ds.api.assets.get(ids)
                    .then(() => {
                        const promiseList = R.uniq(pairs.filter(p => p.length === 2))
                            .map(([assetId1, assetId2]) => ds.api.pairs.get(assetId1, assetId2));
                        return Promise.all(promiseList);
                    })
                    .then((pairs) => {
                        const promiseList = R.splitEvery(20, R.uniq(pairs)).map((pairs) => {
                            return ds.api.pairs.info(...pairs)
                                .then(infoList => infoList.map((data, i) => ({
                                    ...data,
                                    pairNames:
                                        `${pairs[i].amountAsset.displayName} / ${pairs[i].priceAsset.displayName}`,
                                    pairIdList: [pairs[i].amountAsset.id, pairs[i].priceAsset.id]
                                })))
                                .catch(() => pairs.map(WatchList._getEmptyPairData));
                        });

                        return Promise.all(promiseList);
                    })
                    .then(R.flatten);
            }

            static _getEmptyPairData(pair) {
                return {
                    amountAsset: pair.amountAsset,
                    priceAsset: pair.priceAsset,
                    pairNames: `${pair.amountAsset.displayName} / ${pair.priceAsset.displayName}`,
                    pairIdList: [pair.amountAsset.id, pair.priceAsset.id],
                    id: [pair.amountAsset.id, pair.priceAsset.id].sort().join(),
                    lastPrice: null,
                    firstPrice: null,
                    volume: null,
                    change24: null
                };
            }

            /**
             * @param {Array<string>} assetIdList
             * @return {Array<Array<string>>}
             * @private
             */
            static _getAllCombinations(assetIdList) {
                const pairs = [];

                assetIdList.forEach((assetId, index) => {
                    assetIdList
                        .slice(index + 1)
                        .forEach((anotherAssetId) => {
                            pairs.push([assetId, anotherAssetId].sort());
                        });
                });

                return pairs;
            }

        }

        return new WatchList();
    };

    controller.storage = Object.create(null);

    controller.$inject = [
        'Base',
        '$scope',
        'utils',
        'waves',
        'stService',
        'PromiseControl',
        'createPoll',
        '$element',
        'modalManager',
        'configService'
    ];

    angular.module('app.dex')
        .component('wDexWatchlist', {
            templateUrl: 'modules/dex/directives/dexWatchlist/DexWatchlist.html',
            controller
        });
})();

/**
 * @name WatchList
 */

/**
 * @typedef {object} WatchList#IPairDataItem
 * @property {string} id
 * @property {AssetPair} pair
 * @property {boolean} isFavorite
 * @property {string} pairNames
 * @property {Array<string>} pairIdList
 * @property {BigNumber} change24
 * @property {BigNumber} volume
 */

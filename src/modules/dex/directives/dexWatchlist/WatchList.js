{
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
     * @returns {WatchList}
     */
    const controller = function (Base, $scope, utils, waves, stService, PromiseControl, createPoll) {
        'use strict';

        const R = require('ramda');
        const entities = require('@waves/data-entities');
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
                    Object.create(null),
                    WatchList._loadDataByPairs,
                    WatchList._getKeyByPair,
                    1000 * 60 * 2,
                    pair => (list) => list.find((p) => R.equals(p.pairIdList, pair) || R.equals(p.pairIdList.reverse(), pair))
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
                        sort: this._getComparatorByPath('pair')
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
                this.pairDataList = [];
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
                    _favourite: 'dex.watchlist.favourite',
                    _assetsIds: 'dex.watchlist.list',
                    _assetIdPair: 'dex.assetIdPair'
                });

                this._initializeActiveTab();

                this.observe('_assetIdPair', this._onChangeChosenPair);
                this.observe('activeTab', this._onChangeActiveTab);

                this._loadData();
            }

            /**
             * @param {WatchList.IPairDataItem} pairData
             * @return boolean
             */
            isChosen(pairData) {
                return this._assetIdPair.amount === pairData.pair.amountAsset.id &&
                    this._assetIdPair.price === pairData.pair.priceAsset.id;
            }

            /**
             * @param {WatchList.IPairDataItem} pairData
             */
            choosePair(pairData) {
                const pair = {
                    amount: pairData.pair.amountAsset.id,
                    price: pairData.pair.priceAsset.id
                };
                this._assetIdPair = pair;
            }

            chooseSelect() {
                this.isActiveSelect = true;
                this.activeTab = this.dropDownId;
            }

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

                if (!!this._favoriteHash[key]) {
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

                if (!R.find(R.propEq('id', id), this.pairDataList)) {
                    this._cache([id.split(',')]).then(([item]) => {
                        this.pairDataList.push(item);
                        WatchList._renderSmartTable();
                    });
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

            _loadData() {
                this.pending = true;
                const pairs = this._getPairList();
                return this._cache(pairs).then((pairDataList) => {
                    this.pairDataList = pairDataList;
                    this.pending = false;
                    $scope.$apply();
                })
            }

            /**
             * @returns {function (list: Array): Array}
             * @private
             */
            _getTableFilter() {
                return list => list.filter((item) => {
                    if (this.isChosen(item)) {
                        return true;
                    }
                    return this._filterDataItemByTab(item) && this._filterDataItemByQuery(item);
                })
            }

            /**
             * @param {WatchList.IPairDataItem} item
             * @returns {boolean}
             * @private
             */
            _filterDataItemByTab(item) {
                let canShow = this.showOnlyFavorite ? this.isFavourite(item) : true;

                switch (this.activeTab) {
                    case 'all':
                        return canShow;
                    default:
                        return canShow && (
                                item.pair.amountAsset.id === this.activeTab ||
                                item.pair.priceAsset.id === this.activeTab
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

                if (!this._searchAssets.length) {
                    return true;
                }

                const search = (query) => {
                    const queryList = query.split('/');

                    if (queryList.length === 1) {
                        const q = query.toLowerCase();

                        if (WatchList._isId(query)) {
                            return item.pairIdList.includes(query);
                        } else {
                            return item.pair.amountAsset.displayName.toLowerCase().indexOf(q) === 0 ||
                                item.pair.priceAsset.displayName.toLowerCase().indexOf(q) === 0;
                        }
                    }

                    if (queryList[0] && queryList[1] === '') {
                        const q = queryList[0].toLowerCase();

                        if (WatchList._isId(queryList[0])) {
                            return item.pairIdList.includes(queryList[0]);
                        } else {
                            return item.pair.amountAsset.displayName.toLowerCase() === q ||
                                item.pair.priceAsset.displayName.toLowerCase() === q;
                        }
                    }

                    if (!queryList[0] && queryList[1]) {
                        return search(query.replace('/', ''));
                    }

                    return search(queryList[0]) && search(queryList[1]);
                };

                return search(query);
            }

            /**
             * @private
             */
            _onChangeSearch() {
                if (this.searchRequest) {
                    this.searchRequest.drop();
                    this.searchInProgress = false;
                    this.pending = false;
                }

                const query = this.search;
                this._searchAssets = [];

                const queryParts = query.split('/').slice(0, 2).filter(i => i.length >= 2);

                if (!queryParts.length) {
                    WatchList._renderSmartTable();
                    return null;
                }

                this.searchInProgress = true;
                this.pending = true;

                this.searchRequest = new PromiseControl(Promise.all(queryParts.map(waves.node.assets.search)))
                    .then(([d1 = [], d2 = []]) => {
                        this._searchAssets = R.uniqBy(R.prop('id'), d1.concat(d2));
                        return this._loadData();
                    })
                    .then(() => {
                        this.searchInProgress = false;
                        this.searchRequest = null;
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
                WatchList._renderSmartTable();
            }

            /**
             * @private
             */
            _getPairList() {
                const favorite = (this._favourite || []).map(p => p.sort());
                const chosen = [this._assetIdPair.amount, this._assetIdPair.price].sort();
                const searchIdList = Object.keys(this._searchAssetsHash);
                const other = WatchList._getAllCombinations(R.uniq(this._assetsIds.concat(searchIdList)));
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
                        this.isFavourite(item) ? favorite.push(item) : other.push(item);
                    });

                    favorite.sort(comparator);
                    other.sort(comparator);

                    return favorite.concat(other);
                }
            }

            static _renderSmartTable() {
                stService.render('watchlist');
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
                }, { assets: [], hash: {} }).assets
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
                                .then(infoList => infoList.map((data, i) => ({ data, pair: pairs[i] })))
                                .catch(() => {
                                    return pairs.map((pair) => ({ pair, data: null }));
                                });
                        });

                        return Promise.all(promiseList);
                    })
                    .then(R.flatten)
                    .then(pairs => Promise.all(pairs.map(WatchList._remapPairData)));
            }

            static _remapPairData({ pair, data }) {

                const pairIdList = [pair.amountAsset.id, pair.priceAsset.id];
                const pairNames = `${pair.amountAsset.displayName} / ${pair.priceAsset.displayName}`;
                const id = pairIdList.sort().join();

                return WatchList._getPriceByPair(pair).then((price) => {

                    const result = {
                        id,
                        pair,
                        pairNames,
                        pairIdList,
                        price,
                        change24: null,
                        volume: null
                    };

                    if (!data) {
                        return result;
                    }

                    const open = new BigNumber(data.firstPrice || 0);
                    const close = new BigNumber(data.lastPrice || 0);
                    const change24 = (!open.eq(0)) ? (close.minus(open).div(open).times(100).dp(2)) : new BigNumber(0);
                    const volume = new BigNumber(data.volume || 0);

                    return { ...result, change24, volume };
                });
            }

            /**
             * @param {AssetPair} pair
             * @returns {Promise<Money>}
             * @private
             */
            static _getPriceByPair(pair) {

                const wait = new Promise((resolve, reject) => {
                    setTimeout(() => {
                        reject(new Error('Timeout error!'));
                    }, 600);
                });

                const dataPromise = ds.api.transactions.getExchangeTxList({
                    amountAsset: pair.amountAsset,
                    priceAsset: pair.priceAsset,
                    limit: 1,
                    timeStart: 0 // TODO Remove after update data services
                }).then((exchangeTx) => {
                    const emptyPrice = new entities.Money(0, pair.priceAsset);
                    return exchangeTx[0] && exchangeTx[0].price || emptyPrice;
                });

                return Promise.race([dataPromise, wait])
                    .catch(() => null);
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

    controller.$inject = ['Base', '$scope', 'utils', 'waves', 'stService', 'PromiseControl', 'createPoll'];

    angular.module('app.dex')
        .component('wDexWatchlist', {
            templateUrl: 'modules/dex/directives/dexWatchlist/DexWatchlist.html',
            controller
        });
}

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
 * @property {Money} price
 * @property {BigNumber} change24
 * @property {BigNumber} volume
 */

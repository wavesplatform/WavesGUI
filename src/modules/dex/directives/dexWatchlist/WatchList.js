{

    const controller = function (Base, $scope) {
        'use strict';

        const R = require('ramda');
        const entities = require('@waves/data-entities');
        const ds = require('data-service');

        class WatchList extends Base {

            constructor() {
                super($scope);
                /**
                 * @type {boolean}
                 */
                this.pending = false;
                /**
                 * @type {*[]}
                 */
                this.headers = [
                    {
                        id: 'favourite',
                        templatePath: 'modules/dex/directives/dexWatchlist/FavouritesColumnHeader.html',
                        scopeData: {
                            toggleOnlyFavourite: () => {
                                this._showOnlyFavorite = !this._showOnlyFavorite;
                            },
                            shouldShowOnlyFavourite: () => {
                                return this.shouldShowOnlyFavourite();
                            }
                        }
                    },
                    {
                        id: 'pair',
                        title: { literal: 'directives.watchlist.pair' },
                        sort: true
                    },
                    {
                        id: 'price',
                        title: { literal: 'directives.watchlist.price' },
                        sort: true
                    },
                    {
                        id: 'change',
                        title: { literal: 'directives.watchlist.chg' },
                        sort: true
                    },
                    {
                        id: 'volume',
                        title: { literal: 'directives.watchlist.volume' },
                        sortActive: true,
                        isAsc: false,
                        sort: true
                    },
                    {
                        id: 'info'
                    }
                ];
                /**
                 * @type {string}
                 */
                this.activeTab = 'all';
                /**
                 * @type {boolean}
                 * @private
                 */
                this._showOnlyFavorite = false;
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
                 * @type {{amount: string, price: string}}
                 * @private
                 */
                this._assetIdPair = null;
            }

            $postLink() {
                this.syncSettings({
                    _favourite: 'dex.watchlist.favourite',
                    _assetsIds: 'dex.watchlist.list',
                    _assetIdPair: 'dex.assetIdPair'
                });

                this.observe('activeTab', this._onChangeActiveTab);
            }

            _onChangeActiveTab() {
                this.pending = true;

                R.pipeP(
                    () => this._getPairList(),
                    WatchList._loadDataByPairs,
                    WatchList._addFlags(this._favourite),
                    (pairDataList) => {
                        this.pending = false;
                        this.pairDataList = pairDataList;
                    }
                )();
            }

            /**
             * @private
             */
            _getPairList() {
                const favorite = this._favourite;
                const other = this._getPairListWithFilter();
                return R.uniq(favorite, other);
            }

            /**
             * @return {Array<Array<string>>}
             * @private
             */
            _getPairListWithFilter() {
                const filter = this.activeTab;

                switch (filter) {
                    case 'all':
                        return WatchList._getAllCombinations(this._assetsIds);
                    default:
                        return WatchList._getCombinationsForId(filter);
                }
            }

            static _addFlags(favoriteList) {
                const favoriteHash = favoriteList.reduce((acc, pair) => {
                    acc[WatchList._getKeyByPair(pair)] = pair;
                    return acc;
                }, Object.create(null));

                return (pairsDataList) => {
                    pairsDataList.forEach((pairData) => {
                        const key = WatchList._getKeyByPair(pairData.pairIdList);
                        pairData.isFavorite = !!favoriteHash[key];
                    });
                    return pairsDataList;
                };
            }

            /**
             * @param {Array<string>} pair
             * @return string
             * @private
             */
            static _getKeyByPair(pair) {
                return pair.sort().join();
            }

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

                if (!data) {
                    return { pair, change24: null, volume: null };
                }

                const open = new BigNumber(data.firstPrice || 0);
                const close = new BigNumber(data.lastPrice || 0);
                const change24 = (!open.eq(0)) ? (close.minus(open).div(open).times(100).dp(2)) : new BigNumber(0);
                const volume = new BigNumber(data.volume || 0);
                const pairIdList = [pair.amountAsset.id, pair.priceAsset.id];
                const pairNames = `${pair.amountAsset.displayName} / ${pair.priceAsset.displayName}`;

                return ds.api.transactions.getExchangeTxList({ // TODO catch
                    amountAsset: pair.amountAsset,
                    priceAsset: pair.priceAsset,
                    limit: 1,
                    timeStart: 0 // TODO Remove
                }).then((exchangeTx) => {
                    const emptyPrice = new entities.Money(0, pair.priceAsset);
                    const price = exchangeTx[0] && exchangeTx[0].price || emptyPrice;

                    return { pair, change24, volume, price, pairNames, pairIdList };
                });
            }

            /**
             * @param {Array<string>} assetIdList
             * @return {Array<Array<string>>}
             * @private
             */
            static _getAllCombinations(assetIdList) {
                const pairs = [];

                assetIdList.forEach((assetId, index) => {
                    this._assetsIds
                        .slice(index + 1)
                        .forEach((anotherAssetId) => {
                            pairs.push([assetId, anotherAssetId]);
                        });
                });

                return pairs;
            }

            /**
             * @param {Array<string>} assetIdList
             * @param {string} id
             * @return {Array<Array<string>>}
             * @private
             */
            static _getCombinationsForId(assetIdList, id) {
                return assetIdList.reduce((pairs, listId) => {
                    if (listId !== id) {
                        pairs.push([listId, id]);
                    }
                    return pairs;
                }, []);
            }

        }

        return utils.bind(new WatchList());
    };

    controller.$inject = ['Base', '$scope'];

    angular.module('app.dex')
        .component('wDexWatchlist', {
            templateUrl: 'modules/dex/directives/dexWatchlist/DexWatchlist.html',
            controller
        });
}

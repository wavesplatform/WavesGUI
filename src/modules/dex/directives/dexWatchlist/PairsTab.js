{
    const R = require('ramda');
    const entities = require('@waves/data-entities');

    class PairsTabService {

        /**
         * @param PairsList
         * @param pairsStorage
         * @param WatchlistSearch
         * @param {Array<string>} defaultPair
         * @param {User} user
         * @param {PairData} PairData
         */
        constructor(PairsList, pairsStorage, WatchlistSearch, defaultPair, user, PairData) {
            const FAVOURITE = 'favourite';
            const OTHER = 'other';
            const WANDERING = 'wandering';
            const SEARCH_RESULTS = 'searchResults';

            const LISTS = [FAVOURITE, OTHER, SEARCH_RESULTS, WANDERING];
            const FAVOURITE_ONLY_LISTS = [FAVOURITE, SEARCH_RESULTS];

            return class PairsTab {

                constructor(tabData) {

                    /**
                     * @type {string}
                     */
                    this.id = tabData.id;

                    /**
                     * @type {string}
                     */
                    this.baseAssetId = tabData.baseAssetId;

                    /**
                     * @type {Map<string, PairsList>}
                     * @private
                     */
                    this._pairsLists = new Map();

                    /**
                     * @type {PairsList}
                     */
                    this._visiblePairs = new PairsList();

                    /**
                     * @type {boolean}
                     * @private
                     */
                    this._isActive = false;

                    /**
                     * @type {string}
                     * @private
                     */
                    this._searchPrefix = tabData.searchPrefix;

                    /**
                     * @type {{ other: string[][], chosen: string[]|null }}
                     * @private
                     */
                    this._activationData = tabData.pairsOfIds;
                }

                /**
                 * @returns {Promise<void>}
                 */
                activate() {
                    if (this._isActive) {
                        return Promise.resolve();
                    }

                    LISTS.forEach((listName) => {
                        this._pairsLists.set(listName, new PairsList());
                    });

                    return this._loadPairsData().then(({ favorite, other, chosen }) => {
                        this._isActive = true;

                        const favoritePairs = favorite.map((data) => new PairData(data));
                        const otherPairs = other.map((data) => new PairData(data));
                        const chosenPairs = [chosen].filter(Boolean).map((data) => new PairData(data));

                        pairsStorage.add(favoritePairs.concat(otherPairs, chosenPairs));
                        pairsStorage.addFavourite(favoritePairs);

                        this._pairsLists.get(FAVOURITE).addPairs(favoritePairs);
                        this._pairsLists.get(OTHER).addPairs(otherPairs.map(p => pairsStorage.get(p.pairOfIds)));
                    });
                }

                /**
                 * @param pairsIds {Array<string>}
                 * @return {PairData}
                 */
                addPairOfIds(pairsIds) {
                    return this._visiblePairs.addPairOfIds(pairsIds);
                }

                /**
                 * @param pair
                 */
                choosePair(pair) {
                    this.clearCurrentPair();
                    this._getWandering().addPair(pair);
                }

                clearCurrentPair() {
                    this._getWandering().clear();
                }

                clearSearchResults() {
                    this._getSearchResults().clear();
                }

                /**
                 * @returns {PairData|null}
                 */
                getChosenPair() {
                    return this._getWandering().getFirstPair() || null;
                }

                /**
                 * @param onlyFavourite
                 * @param query
                 * @returns {PairData}
                 */
                getDefaultPair(onlyFavourite, query) {
                    return this.getReconstructedVisiblePairs(onlyFavourite, query)[0] || pairsStorage.get(defaultPair);
                }

                /**
                 * @returns {Array}
                 */
                getFavourite() {
                    return (
                        this._getFavourite()
                            .getPairsData()
                            .map((pairData) => pairData.pairOfIds)
                    );
                }

                /**
                 * @returns {string}
                 */
                getSearchPrefix() {
                    return this._searchPrefix;
                }

                /**
                 * @param onlyFavourite
                 * @param query
                 * @returns {PairData[]}
                 */
                getReconstructedVisiblePairs(onlyFavourite, query) {
                    let searchLimit = 10;

                    const getFormingVisiblePairsProcessor = (visiblePairs) => (pairsList, listName) => {
                        const pairs = pairsList.getPairsData();

                        pairs.some((pair) => {
                            if (!visiblePairs.has(pair) && listName === SEARCH_RESULTS) {
                                searchLimit--;
                            }

                            visiblePairs.add(pair);

                            return (
                                (listName === OTHER && visiblePairs.size >= 30) ||
                                (listName === SEARCH_RESULTS && searchLimit <= 0)
                            );
                        });
                    };

                    return this._reconstructAndGetVisiblePairs(getFormingVisiblePairsProcessor, onlyFavourite, query);
                }

                /**
                 * @param onlyFavourite
                 * @param query
                 * @returns {*}
                 */
                getSortedByListsVisiblePairs(onlyFavourite, query) {
                    const getSortingByListsProcessor = (visiblePairs) => (pairsList) => {
                        this._visiblePairs.getPairsData().forEach((pair) => {
                            if (pairsList.includes(pair)) {
                                visiblePairs.add(pair);
                            }
                        });
                    };

                    return this._reconstructAndGetVisiblePairs(getSortingByListsProcessor, onlyFavourite, query);
                }

                /**
                 * @param getProcessor
                 * @param onlyFavourite
                 * @param query
                 * @returns {Array}
                 * @private
                 */
                _reconstructAndGetVisiblePairs(getProcessor, onlyFavourite, query) {
                    this._resetFavourite(query);

                    const visiblePairs = new Set();
                    const process = getProcessor(visiblePairs);

                    if (onlyFavourite) {
                        FAVOURITE_ONLY_LISTS.forEach((listName) => {
                            process(this._pairsLists.get(listName), listName);
                        });
                    } else {
                        this._forEachPairsList(process);
                    }

                    const suitablePairs = WatchlistSearch.filter(Array.from(visiblePairs), query);
                    this._visiblePairs.reset(suitablePairs);

                    return this._visiblePairs.getPairsData();
                }

                _resetFavourite(query) {
                    // Preliminary filtering of favourite pairs is required due to quantitative limits of other pairs
                    // based on the quantity of favourite.
                    const suitableFavourite = WatchlistSearch.filter(pairsStorage.getFavourite(), query);
                    this._getFavourite().reset(suitableFavourite);
                }

                /**
                 * @param tabData
                 */
                isBasedOn(tabData) {
                    return this.id === tabData.id;
                }

                /**
                 * @param pair
                 * @returns {boolean}
                 */
                isChosen(pair) {
                    return this._getWandering().includes(pair);
                }

                /**
                 * @param pair
                 * @returns {boolean}
                 */
                isFavourite(pair) {
                    return this._getFavourite().includes(pair);
                }

                /**
                 * @param pairsOfIds
                 * @returns {Promise<void>}
                 */
                setSearchResults(pairsOfIds) {
                    this.clearSearchResults();
                    return PairsTab._loadDataByPairs(pairsOfIds).then((data) => {
                        const pairDataList = data.map((pair) => new PairData(pair));
                        pairsStorage.add(pairDataList);
                        this._getSearchResults().addPairs(pairDataList.map(p => pairsStorage.get(p.pairOfIds)));
                    });
                }

                sortByChangeAscending() {
                    this._visiblePairs.sortByChangeAscending();
                }

                sortByChangeDescending() {
                    this._visiblePairs.sortByChangeDescending();
                }

                sortByPairAscending() {
                    this._visiblePairs.sortByPairAscending();
                }

                sortByPairDescending() {
                    this._visiblePairs.sortByPairDescending();
                }

                sortByPriceAscending() {
                    this._visiblePairs.sortByPriceAscending();
                }

                sortByPriceDescending() {
                    this._visiblePairs.sortByPriceDescending();
                }

                sortByVolumeAscending() {
                    this._visiblePairs.sortByVolumeAscending();
                }

                sortByVolumeDescending() {
                    this._visiblePairs.sortByVolumeDescending();
                }

                /**
                 * @param pair
                 */
                toggleFavourite(pair) {
                    pairsStorage.toggleFavourite(pair);
                }

                /**
                 * @returns {Promise<void>}
                 * @private
                 */
                _expectSort() {
                    this._forEachPairsList((pairsList) => {
                        pairsList.sortOnceVolumesLoaded();
                    });

                    return LISTS.reduce((allPairsSorted, listName) => {
                        return allPairsSorted.then(() => this._pairsLists.get(listName).pairsSorted);
                    }, Promise.resolve());
                }

                _forEachPairsList(doAction) {
                    this._pairsLists.forEach(doAction);
                }

                /**
                 * @returns {PairsList}
                 * @private
                 */
                _getFavourite() {
                    return this._pairsLists.get(FAVOURITE);
                }

                /**
                 * @returns {PairsList}
                 * @private
                 */
                _getSearchResults() {
                    return this._pairsLists.get(SEARCH_RESULTS);
                }

                /**
                 * @returns {PairsList}
                 * @private
                 */
                _getWandering() {
                    return this._pairsLists.get(WANDERING);
                }

                /**
                 * @return {*}
                 * @private
                 */
                _loadPairsData() {
                    const favorite = user.getSetting('dex.watchlist.favourite') || [defaultPair];
                    const { other, chosen = [] } = this._activationData;
                    return PairsTab._loadDataByPairs(favorite.concat(other, [chosen]))
                        .then((pairsInfo) => {

                            const pairId = (pair) => [pair.amountAsset.id, pair.priceAsset.id];
                            const hash = Object.create(null);

                            pairsInfo.forEach((data) => {
                                hash[pairId(data.pair).join('/')] = data;
                                hash[pairId(data.pair).reverse().join('/')] = data;
                            });

                            const getItemFromHashByPair = pair => hash[pair.join('/')];

                            return {
                                favorite: favorite.map(getItemFromHashByPair),
                                chosen: [chosen].map(getItemFromHashByPair)[0],
                                other: other.map(getItemFromHashByPair)
                            };
                        });
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
                        .then(pairs => Promise.all(pairs.map(PairsTab._remapPairData)));
                }

                static _remapPairData({ pair, data }) {

                    if (!data) {
                        return { pair, change24: null, volume: null };
                    }

                    const open = new BigNumber(data.firstPrice || 0);
                    const close = new BigNumber(data.lastPrice || 0);
                    const change24 = (!open.eq(0)) ? (close.minus(open).div(open).times(100).dp(2)) : new BigNumber(0);
                    const volume = new BigNumber(data.volume || 0);

                    return ds.api.transactions.getExchangeTxList({ // TODO catch
                        amountAsset: pair.amountAsset,
                        priceAsset: pair.priceAsset,
                        limit: 1,
                        timeStart: 0 // TODO Remove
                    }).then((exchangeTx) => {
                        const emptyPrice = new entities.Money(0, pair.priceAsset);
                        const price = exchangeTx[0] && exchangeTx[0].price || emptyPrice;

                        return { pair, change24, volume, price };
                    });
                }

            };
        }

    }

    PairsTabService.$inject = ['PairsList', 'PairsStorage', 'WatchlistSearch', 'defaultPair', 'user', 'PairData'];

    angular.module('app.dex').service('PairsTab', PairsTabService);
}

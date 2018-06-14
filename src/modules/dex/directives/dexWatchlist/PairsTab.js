{
    class PairsTabService {

        constructor(PairsList, PairsStorage, WatchlistSearch, defaultPair) {
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

                    const { other, chosen = null } = this._activationData;

                    LISTS.forEach((listName) => {
                        this._pairsLists.set(listName, new PairsList());
                    });

                    this._resetFavourite(this._searchPrefix);
                    this._pairsLists.get(OTHER).addPairsOfIds(other);
                    if (chosen) {
                        this._getWandering().addPairOfIds(chosen);
                    }

                    this._isActive = true;

                    return this._expectSort();
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
                    return this.getReconstructedVisiblePairs(onlyFavourite, query)[0] || PairsStorage.get(defaultPair);
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
                    const suitableFavourite = WatchlistSearch.filter(PairsStorage.getFavourite(), query);
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
                    this._getSearchResults().addPairsOfIds(pairsOfIds);

                    return this._expectSort();
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
                    PairsStorage.toggleFavourite(pair);
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

            };
        }

    }

    PairsTabService.$inject = ['PairsList', 'PairsStorage', 'WatchlistSearch', 'defaultPair'];

    angular.module('app.dex').service('PairsTab', PairsTabService);
}

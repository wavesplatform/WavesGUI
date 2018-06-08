{
    class PairsTabService {

        constructor(PairsList) {
            const FAVOURITE = 'favourite';
            const OTHER = 'other';
            const WANDERING = 'wandering';
            const SEARCH_RESULTS = 'searchResults';

            const LISTS = [FAVOURITE, OTHER, SEARCH_RESULTS, WANDERING];
            const FAVOURITE_ONLY_LISTS = [FAVOURITE, SEARCH_RESULTS];

            return class PairsTab {

                constructor(tabData) {

                    /**
                     * @type {Map<any, any>}
                     * @private
                     */
                    this._pairsLists = new Map();

                    /**
                     * @type {Array}
                     */
                    this._visiblePairs = new PairsList();

                    /**
                     * @type {boolean}
                     * @private
                     */
                    this._isActive = false;

                    /**
                     * @type {string}
                     */
                    this.id = tabData.id;

                    /**
                     * @type {string}
                     * @private
                     */
                    this._searchPrefix = tabData.searchPrefix;

                    /**
                     * @type {{favourite: string[][], other: string[][], chosen: string[]|null}}
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

                    const { favourite, other, chosen = null } = this._activationData;

                    LISTS.forEach((group) => {
                        this._pairsLists.set(group, new PairsList());
                    });

                    this._getFavourite().addPairsOfIds(favourite);
                    this._pairsLists.get(OTHER).addPairsOfIds(other);
                    if (chosen) {
                        this._getWandering().addPairOfIds(chosen);
                    }

                    this._isActive = true;

                    return this._expectSort();
                }

                /**
                 * @param pair
                 */
                choosePair(pair) {
                    this._getWandering().clear();
                    this._getWandering().addPair(pair);
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
                 * @returns {PairData}
                 */
                getDefaultPair() {
                    return this._getFavourite().getFirstPair();
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
                 * @returns {any[]}
                 */
                getReconstructedVisiblePairs(onlyFavourite) {
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

                    return this._getProcessedVisiblePairs(getFormingVisiblePairsProcessor, onlyFavourite);
                }

                /**
                 * @param onlyFavourite
                 * @returns {*}
                 */
                getVisiblePairs(onlyFavourite) {
                    const getSortingByListsProcessor = (visiblePairs) => (pairsList) => {
                        this._visiblePairs.getPairsData().forEach((pair) => {
                            if (pairsList.includes(pair)) {
                                visiblePairs.add(pair);
                            }
                        });
                    };

                    return this._getProcessedVisiblePairs(getSortingByListsProcessor, onlyFavourite);
                }

                /**
                 * @param getProcessor
                 * @param onlyFavourite
                 * @returns {Array}
                 * @private
                 */
                _getProcessedVisiblePairs(getProcessor, onlyFavourite) {
                    const visiblePairs = new Set();
                    const process = getProcessor(visiblePairs);

                    if (onlyFavourite) {
                        FAVOURITE_ONLY_LISTS.forEach((listName) => {
                            process(this._pairsLists.get(listName), listName);
                        });
                    } else {
                        this._forEachPairsList(process);
                    }

                    this._visiblePairs.reset(Array.from(visiblePairs));

                    return this._visiblePairs.getPairsData();
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
                 * @returns {Promise<void>}
                 */
                toggleFavourite(pair) {
                    if (this.isFavourite(pair)) {
                        this._getFavourite().removePair(pair);
                    } else {
                        this._getFavourite().addPairAndSort(pair);
                    }

                    return this._expectSort();
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

    PairsTabService.$inject = ['PairsList'];

    angular.module('app.dex').service('PairsTab', PairsTabService);
}

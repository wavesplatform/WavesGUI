{
    class PairsTabService {

        constructor(PairsList) {
            const FAVOURITE = 'favourite';
            const OTHER = 'other';
            const WANDERING = 'wandering';
            const SEARCH_RESULTS = 'searchResults';

            const LISTS = [FAVOURITE, OTHER, SEARCH_RESULTS, WANDERING];

            return class PairsTab {

                constructor(tabData) {

                    /**
                     * @type {{}}
                     * @private
                     */
                    this._pairsLists = new Map();

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
                getVisiblePairs(onlyFavourite) {
                    const visiblePairs = new Set();
                    let searchLimit = 10;

                    this._forEachPairsList((pairsList, listName) => {
                        if (onlyFavourite && [OTHER, WANDERING].includes(listName)) {
                            return;
                        }

                        const pairs = pairsList.getPairsData();

                        pairs.some((pair) => {
                            visiblePairs.add(pair);

                            if (listName === SEARCH_RESULTS) {
                                searchLimit--;
                            }

                            return (
                                (listName === OTHER && visiblePairs.size >= 30) ||
                                (listName === SEARCH_RESULTS && searchLimit <= 0)
                            );
                        });
                    });

                    return Array.from(visiblePairs);
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
                    this._forEachPairsList((pairsList) => pairsList.sortByChangeAscending());
                }

                sortByChangeDescending() {
                    this._forEachPairsList((pairsList) => pairsList.sortByChangeDescending());
                }

                sortByPairAscending() {
                    this._forEachPairsList((pairsList) => pairsList.sortByPairAscending());
                }

                sortByPairDescending() {
                    this._forEachPairsList((pairsList) => pairsList.sortByPairDescending());
                }

                sortByPriceAscending() {
                    this._forEachPairsList((pairsList) => pairsList.sortByPriceAscending());
                }

                sortByPriceDescending() {
                    this._forEachPairsList((pairsList) => pairsList.sortByPriceDescending());
                }

                sortByVolumeAscending() {
                    this._forEachPairsList((pairsList) => pairsList.sortByVolumeAscending());
                }

                sortByVolumeDescending() {
                    this._forEachPairsList((pairsList) => pairsList.sortByVolumeDescending());
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

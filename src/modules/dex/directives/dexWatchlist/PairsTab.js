{
    class PairsTabService {

        constructor(PairsList) {
            const FAVOURITE = 'favourite';
            const OTHER = 'other';
            const WANDERING = 'wandering';
            const SEARCH_RESULTS = 'searchResults';

            const LISTS = [FAVOURITE, OTHER, WANDERING, SEARCH_RESULTS];

            return class PairsTab {

                constructor() {

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
                }

                /**
                 * @param favourite
                 * @param other
                 * @param chosen
                 * @returns {Promise<void>}
                 */
                activate({ favourite, other, chosen = null }) {
                    if (this._isActive) {
                        return Promise.resolve();
                    }

                    LISTS.forEach((group) => {
                        this._pairsLists.set(group, new PairsList());
                    });

                    this._getFavourite().addPairsOfIds(favourite);
                    this._pairsLists.get(OTHER).addPairsOfIds(other);
                    if (chosen) {
                        this._getWandering().addPairsOfIds([chosen]);
                    }

                    this._isActive = true;

                    return this._expectSort();
                }

                /**
                 * @param pair
                 * @returns {boolean}
                 */
                isFavourite(pair) {
                    return this._getFavourite().includes(pair);
                }

                /**
                 * @param pair
                 */
                chosePair(pair) {
                    this._getWandering().clear();
                    this._getWandering().addPair(pair);
                }

                /**
                 * @param pair
                 * @returns {boolean}
                 */
                isChosen(pair) {
                    return this._getWandering().includes(pair);
                }

                /**
                 * @returns {PairList}
                 * @private
                 */
                _getWandering() {
                    return this._pairsLists.get(WANDERING);
                }

                /**
                 * @param pair
                 * @returns {Promise<void>}
                 */
                toggleFavourite(pair) {
                    if (this.isFavourite(pair)) {
                        this._getFavourite().removePair(pair);
                    } else {
                        this._getFavourite().addPair(pair);
                    }

                    return this._expectSort();
                }

                /**
                 * @returns {PairList}
                 * @private
                 */
                _getFavourite() {
                    return this._pairsLists.get(FAVOURITE);
                }

                /**
                 * @param onlyFavourite
                 * @returns {any[]}
                 */
                getVisiblePairs(onlyFavourite) {
                    const visiblePairs = new Set();
                    let searchLimit = 10;

                    this._pairsLists.forEach((pairList, listName) => {
                        if (onlyFavourite && [OTHER, WANDERING].includes(listName)) {
                            return;
                        }

                        const pairs = pairList.getPairsData();

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
                 * @param pairsOfIds
                 * @returns {Promise<void>}
                 */
                addSearchResults(pairsOfIds) {
                    this._getSearchResults().addPairsOfIds(pairsOfIds);

                    return this._expectSort();
                }

                clearSearchResults() {
                    this._getSearchResults().clear();
                }

                /**
                 * @returns {PairList}
                 * @private
                 */
                _getSearchResults() {
                    return this._pairsLists.get(SEARCH_RESULTS);
                }

                /**
                 * @returns {Promise<void>}
                 * @private
                 */
                _expectSort() {
                    this._pairsLists.forEach((pairsList) => {
                        pairsList.sortOnceVolumesLoaded();
                    });

                    return LISTS.reduce((allPairsSorted, listName) => {
                        return allPairsSorted.then(() => this._pairsLists.get(listName).pairsSorted);
                    }, Promise.resolve());
                }

            };
        }

    }

    PairsTabService.$inject = ['PairsList'];

    angular.module('app.dex').service('PairsTab', PairsTabService);
}

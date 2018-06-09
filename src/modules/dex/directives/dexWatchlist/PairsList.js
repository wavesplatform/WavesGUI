{
    class PairsListService {

        constructor(PairData, utils, PairsStorage) {
            return class PairsList {

                constructor() {
                    /**
                     * @type {Promise<void>}
                     */
                    this.pairsSorted = Promise.resolve();

                    /**
                     * @type {Array}
                     * @private
                     */
                    this._pairsData = [];
                }

                /**
                 * @param pairs
                 */
                addPairs(pairs) {
                    pairs.forEach((pair) => {
                        this.addPair(pair);
                    });
                }

                /**
                 * @param pair
                 */
                addPair(pair) {
                    this._pairsData.push(pair);
                }

                /**
                 * @param pair
                 * @returns {*}
                 */
                addPairAndSort(pair) {
                    this.addPair(pair);
                    return this._sortOnceVolumesLoaded();
                }

                /**
                 * @param pairOfIds
                 */
                addPairOfIds(pairOfIds) {
                    let pair = PairsStorage.get(pairOfIds);

                    if (!pair) {
                        pair = new PairData(pairOfIds);
                        PairsStorage.add(pair);
                    }

                    this._pairsData.push(pair);
                }

                /**
                 * @param pairsOfIds
                 */
                addPairsOfIds(pairsOfIds) {
                    pairsOfIds.forEach((pairOfIds) => {
                        this.addPairOfIds(pairOfIds);
                    });
                }

                clear() {
                    this._pairsData = [];
                }

                /**
                 * @returns {PairData}
                 */
                getFirstPair() {
                    return this._pairsData[0];
                }

                /**
                 * @returns {Array}
                 */
                getPairsData() {
                    return this._pairsData;
                }

                /**
                 * @param pair
                 * @returns {boolean}
                 */
                includes(pair) {
                    return this._pairsData.includes(pair);
                }

                /**
                 * @param pair
                 */
                removePair(pair) {
                    const pairIndex = this._pairsData.indexOf(pair);

                    if (pairIndex >= 0) {
                        this._pairsData.splice(pairIndex, 1);
                    }
                }

                /**
                 * @param pairs
                 */
                reset(pairs) {
                    this.clear();
                    this.addPairs(pairs);
                }

                sortByChangeAscending() {
                    this._sortByAscending(this._getChangeConverter());
                }

                sortByChangeDescending() {
                    this._sortByDescending(this._getChangeConverter());
                }

                sortByPairAscending() {
                    this._sortByAscending((pair) => pair.pair);
                }

                sortByPairDescending() {
                    this._sortByDescending((pair) => pair.pair);
                }

                sortByPriceAscending() {
                    this._sortByAscending((pair) => pair.priceBigNumber);
                }

                sortByPriceDescending() {
                    this._sortByDescending((pair) => pair.priceBigNumber);
                }

                sortByVolumeAscending() {
                    this._sortByAscending((pair) => pair.bigNumberVolume);
                }

                sortByVolumeDescending() {
                    this._sortByDescending((pair) => pair.bigNumberVolume);
                }

                sortOnceVolumesLoaded() {
                    this.pairsSorted = new Promise((resolve) => {
                        this._sortOnceVolumesLoaded()
                            .then(resolve);
                    });
                }

                /**
                 * @returns {function(*): number}
                 * @private
                 */
                _getChangeConverter() {
                    return (pair) => parseFloat(pair.change);
                }

                /**
                 * @param sort
                 * @param getValue
                 * @private
                 */
                _sortBy(sort, getValue) {
                    this._pairsData.sort((pairData, anotherPairData) => {
                        return (
                            sort(getValue(pairData), getValue(anotherPairData))
                        );
                    });
                }

                /**
                 * @param getValue
                 * @private
                 */
                _sortByAscending(getValue) {
                    this._sortBy(utils.comparators.smart.asc, getValue);
                }

                /**
                 * @param getValue
                 * @private
                 */
                _sortByDescending(getValue) {
                    this._sortBy(utils.comparators.smart.desc, getValue);
                }

                /**
                 * @returns {Promise<T>}
                 * @private
                 */
                _sortOnceVolumesLoaded() {
                    return this._pairsData
                        .reduce((loadingProgress, pairData) => {
                            return (loadingProgress.then(() => pairData.volumeRequest));
                        }, Promise.resolve())
                        .then(() => {
                            this.sortByVolumeDescending();
                        });
                }

            };
        }

    }

    PairsListService.$inject = ['PairData', 'utils', 'PairsStorage'];

    angular.module('app.dex').service('PairsList', PairsListService);
}

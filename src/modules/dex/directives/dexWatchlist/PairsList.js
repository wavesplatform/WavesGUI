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
                    this._pairsData.length = 0;
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

                sortOnceVolumesLoaded() {
                    this.pairsSorted = new Promise((resolve) => {
                        this._sortOnceVolumesLoaded()
                            .then(resolve);
                    });
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
                            this._pairsData.sort((pairData, anotherPairData) => {
                                return (
                                    utils
                                        .comparators
                                        .bigNumber
                                        .desc(pairData.bigNumberVolume, anotherPairData.bigNumberVolume)
                                );
                            });
                        });
                }

            };
        }

    }

    PairsListService.$inject = ['PairData', 'utils', 'PairsStorage'];

    angular.module('app.dex').service('PairsList', PairsListService);
}

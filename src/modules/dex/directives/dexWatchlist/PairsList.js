{
    class PairListService {

        constructor(PairData, utils) {
            return class PairList {

                constructor() {
                    /**
                     * @type {Promise<void>}
                     */
                    this.pairsSorted = null;

                    /**
                     * @type {Array}
                     * @private
                     */
                    this._pairsData = [];
                }

                addPair(pair) {
                    this._pairsData.push(pair);
                    return this._sortOnceVolumesLoaded();
                }

                removePair(pair) {
                    const pairIndex = this._pairsData.indexOf(pair);

                    if (pairIndex >= 0) {
                        this._pairsData.splice(pairIndex, 1);
                    }
                }

                includes(pair) {
                    return this._pairsData.includes(pair);
                }

                addPairOfIds(pairOfIds) {
                    this._pairsData.push(new PairData(pairOfIds));
                }

                includesPairOfIds(pairOfIds) {
                    return this._pairsData.some((pairFromList) => {
                        return this._areEqualPairs(pairFromList.pairOfIds, pairOfIds);
                    });
                }

                _areEqualPairs(pair, anotherPair) {
                    return pair.reduce((isKnownPair, id) => isKnownPair && anotherPair.includes(id), true);
                }


                getPairsData() {
                    return this._pairsData;
                }

                clear() {
                    this._pairsData.length = 0;
                }

                sortOnceVolumesLoaded() {
                    this.pairsSorted = new Promise((resolve) => {
                        this._sortOnceVolumesLoaded()
                            .then(resolve);
                    });
                }

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

    PairListService.$inject = ['PairData', 'utils'];

    angular.module('app.dex').service('PairList', PairListService);
}

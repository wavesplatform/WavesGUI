{
    class PairListService {

        constructor(PairData, utils) {
            return class PairList {

                constructor() {
                    /**
                     * @type {Array}
                     * @private
                     */
                    this._pairs = [];

                    /**
                     * @type {Array}
                     * @private
                     */
                    this._pairsData = [];

                    /**
                     * @type {Promise<void>}
                     */
                    this.pairsSorted = null;
                }

                addPair(pairOfIds) {
                    this._pairs.push(pairOfIds);
                    this._pairsData.push(new PairData(pairOfIds));
                }

                includes(pairOfIds) {
                    return this._pairs.some((pairFromList) => {
                        return this._areEqualPairs(pairFromList, pairOfIds);
                    });
                }

                _areEqualPairs(pair, anotherPair) {
                    return pair.reduce((isKnownPair, id) => isKnownPair && anotherPair.includes(id), true);
                }


                getPairsData() {
                    return this._pairsData;
                }

                clear() {
                    this._pairs = [];
                    this._pairsData = [];
                }

                sortOnceVolumesLoaded() {
                    this.pairsSorted = new Promise((resolve) => {
                        this._pairsData
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

                                resolve();
                            });
                    });
                }

            };
        }

    }

    PairListService.$inject = ['PairData', 'utils'];

    angular.module('app.dex').service('PairList', PairListService);
}

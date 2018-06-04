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

                addPair(pair) {
                    this._pairsData.push(pair);
                }

                addPairAndSort(pair) {
                    this.addPair(pair);
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

                addPairsOfIds(pairsOfIds) {
                    pairsOfIds.forEach((pairOfIds) => {
                        this.addPairOfIds(pairOfIds);
                    });
                }

                addPairOfIds(pairOfIds) {
                    let pair = PairsStorage.get(pairOfIds);

                    if (!pair) {
                        pair = new PairData(pairOfIds);
                        PairsStorage.add(pair);
                    }

                    this._pairsData.push(pair);
                }

                getFirstPair() {
                    return this._pairsData[0];
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

    PairsListService.$inject = ['PairData', 'utils', 'PairsStorage'];

    angular.module('app.dex').service('PairsList', PairsListService);
}

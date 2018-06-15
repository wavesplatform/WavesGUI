{
    class PairsStorage {

        constructor(PairData) {
            /**
             * @type {Map<string, PairData>}
             * @private
             */
            this._storage = new Map();

            /**
             * @type {Set<PairData>}
             * @private
             */
            this._favourite = new Set();

            /**
             * @type {PairData}
             */
            this.PairData = PairData;

            return {
                get: pairOfIds => this._get(pairOfIds),
                add: (pairs) => this._add(pairs),
                has: id => this._has(id),
                addFavourite: pairDataList => this._addFavourite(pairDataList),
                getFavourite: () => Array.from(this._favourite),
                toggleFavourite: pair => this._toggleFavourite(pair)
            };
        }

        _add(pairs) {
            pairs.forEach((pairData) => {
                const id = [pairData.amountAsset.id, pairData.priceAsset.id];
                if (!this._has(id)) {
                    this._storage.set(id.sort().join(), pairData);
                }
            });
        }

        /**
         * @param pairsOfIds
         * @returns {boolean}
         * @private
         */
        _has(pairsOfIds) {
            return this._storage.has(pairsOfIds.sort().join());
        }

        /**
         * @param pairDataList
         * @private
         */
        _addFavourite(pairDataList) {
            pairDataList.forEach(pairData => {
                if (!this._has(pairData.pairOfIds)) {
                    this._add([pairData]);
                }
                this._favourite.add(this._get(pairData.pairOfIds));
            });
        }

        /**
         * @param pair
         * @private
         */
        _addToFavourite(pair) {
            this._favourite.add(pair);
        }

        /**
         * @param pairsOfIds
         * @returns {*}
         * @private
         */
        _get(pairsOfIds) {
            return this._storage.get(pairsOfIds.sort().join());
        }

        /**
         * @param pair
         * @private
         */
        _toggleFavourite(pair) {
            if (this._favourite.has(pair)) {
                this._favourite.delete(pair);
            } else {
                this._addToFavourite(pair);
            }
        }

    }

    PairsStorage.$inject = ['PairData'];

    angular.module('app.dex').service('PairsStorage', PairsStorage);
}

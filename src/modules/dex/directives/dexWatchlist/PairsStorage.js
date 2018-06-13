{
    class PairsStorage {

        constructor(PairData) {
            /**
             * @type {Map<string, Map<string, PairData>>}
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
                get: (pairOfIds) => {
                    return this._get(pairOfIds);
                },
                addFavourite: (pairsOfIds) => {
                    this._addFavourite(pairsOfIds);
                },
                getFavourite: () => {
                    return Array.from(this._favourite);
                },
                toggleFavourite: (pair) => {
                    this._toggleFavourite(pair);
                }
            };
        }

        /**
         * @param pair
         * @private
         */
        _add(pair) {
            const { pairOfIds: idsPairBasedOn } = pair;
            const [id, anotherId] = idsPairBasedOn;
            this._addPair(id, anotherId, pair);
            this._addPair(anotherId, id, pair);
        }

        /**
         * @param pairOfIds
         * @returns {PairData}
         * @private
         */
        _addBy(pairOfIds) {
            const pair = new this.PairData(pairOfIds);
            this._add(pair);

            return pair;
        }

        /**
         * @param pairsOfIds
         * @private
         */
        _addFavourite(pairsOfIds) {
            for (const pairOfIds of pairsOfIds) {
                const pair = this._get(pairOfIds);
                this._addToFavourite(pair);
            }
        }

        /**
         * @param id
         * @param anotherId
         * @param pair
         * @private
         */
        _addPair(id, anotherId, pair) {
            let pairsOfId = this._getPairsOfId(id);
            if (!pairsOfId) {
                pairsOfId = new Map();
                this._storage.set(id, pairsOfId);
            }

            const pairFromStorage = pairsOfId.get(anotherId);
            if (!pairFromStorage) {
                pairsOfId.set(anotherId, pair);
            }
        }

        /**
         * @param pair
         * @private
         */
        _addToFavourite(pair) {
            this._favourite.add(pair);
        }

        /**
         * @param id
         * @param anotherId
         * @returns {*}
         * @private
         */
        _get([id, anotherId]) {
            const pairsOfId = this._getPairsOfId(id) || { get: () => null };
            const pair = pairsOfId.get(anotherId);

            return pair || this._addBy([id, anotherId]);
        }

        /**
         * @param id
         * @returns {Map<string, PairData> | null}
         * @private
         */
        _getPairsOfId(id) {
            return this._storage.get(id) || null;
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

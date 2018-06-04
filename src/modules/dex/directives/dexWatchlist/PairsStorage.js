{
    class PairsStorage {

        constructor() {
            this._storage = new Map();

            return {
                add: (pair) => {
                    this._add(pair);
                },
                get: (pairOfIds) => {
                    return this._get(pairOfIds);
                }
            };
        }

        _add(pair) {
            const { pairOfIds: idsPairBasedOn } = pair;
            const [id, anotherId] = idsPairBasedOn;
            this._addPair(id, anotherId, pair);
            this._addPair(anotherId, id, pair);
        }

        _addPair(id, anotherId, pair) {
            let pairsOfId = this._getPairsOfId(id);
            if (!pairsOfId) {
                pairsOfId = new Map();
                pairsOfId.set(id, pairsOfId);
                this._storage.set(id, pairsOfId);
            }

            const pairFromStorage = pairsOfId.get(anotherId);
            if (!pairFromStorage) {
                pairsOfId.set(anotherId, pair);
            }
        }

        _get([id, anotherId]) {
            const pairsOfId = this._getPairsOfId(id);

            if (!pairsOfId) {
                return null;
            }

            return pairsOfId.get(anotherId) || null;
        }

        _getPairsOfId(id) {
            return this._storage.get(id) || null;
        }

    }

    PairsStorage.$inject = [];

    angular.module('app.dex').service('PairsStorage', PairsStorage);
}

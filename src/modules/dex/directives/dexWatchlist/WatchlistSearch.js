{

    class WatchlistSearch {

        constructor(waves, gateways, sepaGateways) {

            /**
             * @type {{resolve: Function }}
             */
            let searchProgress = {
                resolve: angular.noop
            };

            /**
             * @type {number}
             */
            let searchDelay = null;

            /**
             * @type {{results: Array, nothingFound: boolean}}
             */
            const INTERRUPTED_SEARCH_RESULT = {
                results: [],
                nothingFound: false
            };

            return {
                search
            };

            function search(query) {
                searchProgress.resolve(INTERRUPTED_SEARCH_RESULT);
                clearTimeout(searchDelay);

                return new Promise((resolve) => {
                    searchProgress = { resolve };

                    if (!query.length) {
                        resolve(INTERRUPTED_SEARCH_RESULT);
                        return;
                    }

                    searchDelay = setTimeout(() => {
                        prepareSearches(query)
                            .then((searches) => {
                                Promise.all(searches.map((search) => search.run()))
                                    .then((results) => {
                                        const pairs = buildPairsOfIds(results);

                                        resolve({
                                            results: pairs,
                                            nothingFound: pairs.length === 0
                                        });
                                    });
                            });
                    }, 500);
                });
            }

            function prepareSearches(query = '') {
                const SEPARATOR = '/';

                const splitMask = new RegExp(`([^/]*)${SEPARATOR}?(.*)`);
                const splitResult = splitMask.exec(query);

                return Promise.all([
                    getFirstItemSearch(splitResult[1], query.includes(SEPARATOR)),
                    getSecondItemSearch(splitResult[2], query.includes(SEPARATOR))
                ]);
            }

            function getFirstItemSearch(value, separatorIncluded) {
                return tryToTreatAsIdAndGetSearchItem(value, buildFirstItemSearch(value, separatorIncluded));
            }

            function buildFirstItemSearch(value, separatorIncluded) {
                return (asset) => {
                    if (!asset && value && separatorIncluded) {
                        return {
                            value,
                            run: searchStrict
                        };
                    }

                    return buildAnyItemSearch(value)(asset);
                };
            }

            function searchStrict() {
                return searchAsset(this.value, (name, ticker, value) => name === value || ticker === value);
            }

            function getSecondItemSearch(value) {
                return tryToTreatAsIdAndGetSearchItem(value, buildAnyItemSearch(value));
            }

            function tryToTreatAsIdAndGetSearchItem(value, searchGetter) {
                return (
                    waves.node
                        .assets
                        .getExtendedAsset(value)
                        .then(() => true, () => false)
                        .then((isId) => {
                            return searchGetter(isId);
                        })
                );
            }

            function buildAnyItemSearch(value) {
                return (isId) => {
                    if (isId) {
                        return {
                            value,
                            run: searchId
                        };
                    }

                    if (!value) {
                        return {
                            value,
                            run: searchGateways
                        };
                    }

                    return {
                        value,
                        run: searchLoose
                    };
                };
            }

            function searchId() {
                return Promise.resolve([this.value]);
            }

            function searchGateways() {
                const allGateways = Object.assign({}, gateways, sepaGateways);
                return Promise.resolve(Object.keys(allGateways));
            }

            function searchLoose() {
                return searchAsset(this.value, (name, ticker, value) => name.includes(value) || ticker.includes(value));
            }

            function searchAsset(value, filter) {
                return waves.node.assets.search(value)
                    .then((results) => {
                        return (
                            results
                                .filter((result) => {
                                    const { name = '', ticker = '' } = result;

                                    return filter(
                                        name.toLowerCase(),
                                        ticker.toLowerCase(),
                                        value.toLowerCase()
                                    );
                                })
                                .map(({ id }) => id)
                        );
                    });
            }

            function buildPairsOfIds([ids, anotherIds]) {
                const pairsOfIds = [];

                ids.forEach((id) => {
                    anotherIds.forEach((anotherId) => {
                        if (id !== anotherId) {
                            pairsOfIds.push([id, anotherId]);
                        }
                    });
                });

                return pairsOfIds;
            }

        }

    }

    WatchlistSearch.$inject = ['waves', 'gateways', 'sepaGateways'];

    angular.module('app.dex').service('WatchlistSearch', WatchlistSearch);
}

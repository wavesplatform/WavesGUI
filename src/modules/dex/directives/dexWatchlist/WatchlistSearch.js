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
                searchFinished: false,
                nothingFound: false
            };

            const EMPTY_QUERY_SEARCH_RESULTS = Object.assign({}, INTERRUPTED_SEARCH_RESULT, { searchFinished: true });

            return {
                filter,
                search
            };

            function filter(pairs, query) {
                if (!query) {
                    return pairs;
                }

                const { firstItem, secondItem, separatorIncluded } = parseQuery(query);

                let firstItemFilter = angular.noop;
                let secondItemFilter = angular.noop;

                if (firstItem && !separatorIncluded) {
                    firstItemFilter = prepareLooseFilter(firstItem);
                    secondItemFilter = acceptAny;
                }

                if (firstItem && secondItem) {
                    firstItemFilter = prepareStrictFilter(firstItem);
                    secondItemFilter = prepareLooseFilter(secondItem);
                }

                if (firstItem && separatorIncluded) {
                    firstItemFilter = prepareStrictFilter(firstItem);
                    secondItemFilter = acceptAny;
                }

                return pairs.filter((pair) => {
                    return (
                        firstItemFilter(pair.amountAsset) && secondItemFilter(pair.priceAsset) ||
                        firstItemFilter(pair.priceAsset) && secondItemFilter(pair.amountAsset)
                    );
                });
            }

            function prepareLooseFilter(value) {
                return prepareFilter(value, ({ name, ticker, id, value, idValue }) => {
                    return name.includes(value) || ticker.includes(value) || id === idValue;
                });
            }

            function prepareStrictFilter(value) {
                return prepareFilter(value, ({ name, ticker, id, value, idValue }) => {
                    return name === value || ticker === value || id === idValue;
                });
            }

            function prepareFilter(value, filter) {
                return ({ name, ticker, id }) => {
                    return filter({
                        name: (name || '').toLowerCase(),
                        ticker: (ticker || '').toLowerCase(),
                        id,
                        value: value.toLowerCase(),
                        idValue: value
                    });
                };
            }

            function acceptAny() {
                return true;
            }

            function search(query) {
                searchProgress.resolve(INTERRUPTED_SEARCH_RESULT);
                clearTimeout(searchDelay);

                return new Promise((resolve) => {
                    searchProgress = { resolve };

                    if (!query.length) {
                        resolve(EMPTY_QUERY_SEARCH_RESULTS);
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
                                            searchFinished: true,
                                            nothingFound: pairs.length === 0
                                        });
                                    });
                            });
                    }, 500);
                });
            }

            function prepareSearches(query = '') {
                const { firstItem, secondItem, separatorIncluded } = parseQuery(query);

                return Promise.all([
                    prepareFirstItemSearch(firstItem, separatorIncluded),
                    prepareSecondItemSearch(secondItem, separatorIncluded)
                ]);
            }

            function parseQuery(query) {
                const SEPARATOR = '/';

                const splitMask = new RegExp(`([^/]*)${SEPARATOR}?(.*)`);
                const splitResult = splitMask.exec(query);

                return {
                    firstItem: splitResult[1].trim(),
                    secondItem: splitResult[2].trim(),
                    separatorIncluded: query.includes(SEPARATOR)
                };
            }

            function prepareFirstItemSearch(value, separatorIncluded) {
                return tryToTreatAsIdAndGetActionItem(value, buildFirstItemSearch(value, separatorIncluded));
            }

            function buildFirstItemSearch(value, separatorIncluded) {
                return (isId) => {
                    if (!isId && value && separatorIncluded) {
                        return {
                            value,
                            run: searchStrict
                        };
                    }
                    return buildAnyItemSearch(value)(isId);
                };
            }

            function searchStrict() {
                return searchAssets(this.value, getStrictFilter);
            }

            function getStrictFilter(value) {
                return buildAssetsFilter(
                    value,
                    (name, ticker, value) => name === value || ticker === value
                );
            }

            function prepareSecondItemSearch(value) {
                return tryToTreatAsIdAndGetActionItem(value, buildAnyItemSearch(value));
            }

            function tryToTreatAsIdAndGetActionItem(value, actionGetter) {
                return (
                    ds.api.transactions.get(value)
                        .then(() => true, () => false)
                        .then((isId) => {
                            return actionGetter(isId);
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
                const allGateways = Object.assign({}, { WAVES: '' }, gateways, sepaGateways);
                return Promise.resolve(Object.keys(allGateways));
            }

            function searchLoose() {
                return searchAssets(this.value, getLooseFilter);
            }

            function searchAssets(value, getFilter) {
                return waves.node.assets.search(value)
                    .then((results) => {
                        return results.filter(getFilter(value)).map(({ id }) => id);
                    });
            }

            function getLooseFilter(value) {
                return buildAssetsFilter(
                    value,
                    (name, ticker, value) => name.includes(value) || ticker.includes(value)
                );
            }

            function buildAssetsFilter(value, filter) {
                return (asset) => {
                    const { name = '', ticker } = asset;

                    return filter(
                        name.toLowerCase(),
                        (ticker || '').toLowerCase(),
                        value.toLowerCase()
                    );
                };
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

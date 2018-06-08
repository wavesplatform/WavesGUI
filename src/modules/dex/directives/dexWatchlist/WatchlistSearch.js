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
                    return Promise.resolve(pairs);
                }

                return (
                    prepareFilter(query)
                        .then((filter) => {
                            return pairs.filter(filter);
                        })
                );
            }

            function prepareFilter(query) {
                const { firstItem, secondItem, separatorIncluded } = parseQuery(query);

                return (
                    Promise.all([
                        prepareFirstItemFilter(firstItem, separatorIncluded),
                        prepareSecondItemFilter(secondItem)
                    ])
                        .then(([firstFilter, secondFilter]) => {
                            return (pair) => {
                                return (
                                    firstFilter.run(pair.amountAsset, query) &&
                                    secondFilter.run(pair.priceAsset, query) ||
                                    firstFilter.run(pair.priceAsset, query) &&
                                    secondFilter.run(pair.amountAsset, query)
                                );
                            };
                        })
                );
            }

            function prepareFirstItemFilter(value, separatorIncluded) {
                return tryToTreatAsIdAndGetActionItem(value, buildFirstItemFilter(value, separatorIncluded));
            }

            function prepareSecondItemFilter(value) {
                return tryToTreatAsIdAndGetActionItem(value, buildAnyItemFilter(value));
            }

            function buildFirstItemFilter(value, separatorIncluded) {
                return buildItemStrictAction(value, separatorIncluded, getStrictFilter(value), buildAnyItemFilter);
            }

            function buildAnyItemFilter(value) {
                return buildAnyItemAction(value, buildIdFilter(value), acceptAny, getLooseFilter(value));
            }

            function buildIdFilter(value) {
                return ({ id }) => id === value;
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
                return buildItemStrictAction(value, separatorIncluded, searchStrict, buildAnyItemSearch);
            }

            function buildItemStrictAction(value, separatorIncluded, strictAction, anyActionBuilder) {
                return (isId) => {
                    if (!isId && value && separatorIncluded) {
                        return {
                            value,
                            run: strictAction
                        };
                    }

                    return anyActionBuilder(value)(isId);
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
                return buildAnyItemAction(value, searchId, searchGateways, searchLoose);
            }

            function buildAnyItemAction(value, idAction, noValueAction, looseAction) {
                return (isId) => {
                    if (isId) {
                        return {
                            value,
                            run: idAction
                        };
                    }

                    if (!value) {
                        return {
                            value,
                            run: noValueAction
                        };
                    }

                    return {
                        value,
                        run: looseAction
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

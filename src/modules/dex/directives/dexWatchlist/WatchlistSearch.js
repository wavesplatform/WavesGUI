{

    class WatchlistSearch {

        constructor(waves) {

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

            /**
             * @type {string}
             */
            const NAME_STUB = '—';

            return {
                search
            };

            function search(value) {
                searchProgress.resolve(INTERRUPTED_SEARCH_RESULT);
                clearTimeout(searchDelay);

                return new Promise((resolve) => {
                    searchProgress = { resolve };

                    if (!value.length) {
                        resolve(INTERRUPTED_SEARCH_RESULT);
                        return;
                    }

                    searchDelay = setTimeout(() => {

                        waves.node.assets.search(value)
                            .then((searchResults) => {
                                resolve(prepareSearchResults(searchResults, value));
                            }, () => {
                                resolve(INTERRUPTED_SEARCH_RESULT);
                            });
                    }, 500);
                });
            }

            function prepareSearchResults(searchResults, value) {
                const results = (
                    searchResults
                        .map((searchResult) => {
                            const { id, ticker, name } = searchResult;

                            return {
                                id,
                                isWatched: false,
                                ticker: getInputPartAndRemainder(value, ticker),
                                name: getInputPartAndRemainder(value, name)
                            };
                        })
                        .filter((searchResult) => {
                            // Prevent appearing of wrong results when the query contains spaces.
                            // todo: replace once the search is ready on api.wavesplatform.com.
                            return !(
                                searchResult.ticker.ending === NAME_STUB &&
                                searchResult.name.ending === NAME_STUB
                            );
                        })
                );

                return {
                    results,
                    nothingFound: results.length === 0
                };
            }

            function getInputPartAndRemainder(query, text = '') {
                const splitMask = new RegExp(`(.*)(${query})(.*)`, 'i');
                const splitResult = splitMask.exec(text) || ['', '', '', NAME_STUB];

                return {
                    beginning: splitResult[1],
                    inputPart: splitResult[2],
                    ending: splitResult[3]
                };
            }

        }

    }

    WatchlistSearch.$inject = ['waves'];

    angular.module('app.dex').service('WatchlistSearch', WatchlistSearch);
}

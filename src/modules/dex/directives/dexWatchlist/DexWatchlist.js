(function () {
    'use strict';

    const TABS_ASSETS = ['WAVES', 'BTC'];
    // Other gateways are added dynamically in the code below.
    const DROP_DOWN_ASSETS = ['ETH', 'BCH', 'LTC', 'USD', 'EUR'];

    /**
     * @param Base
     * @param {Waves} waves
     * @param user
     * @param {$rootScope.Scope} $scope
     * @param {$state} $state
     * @param {$location} $location
     * @param {app.utils.decorators} decorators
     * @param gateways
     * @param sepaGateways
     * @param PairData
     * @param PairsList
     * @param PairsTabs
     * @param WatchlistSearch
     * @return {DexWatchlist}
     */
    const controller = function (
        Base,
        waves,
        user,
        $scope,
        $state,
        $location,
        decorators,
        gateways,
        sepaGateways,
        PairData,
        PairsList,
        PairsTabs,
        WatchlistSearch
    ) {

        class DexWatchlist extends Base {

            constructor() {
                super();

                /**
                 * @type {Array}
                 */
                this.visiblePairsData = [];

                /**
                 * @type {PairsTabs}
                 */
                this.tabs = new PairsTabs();

                /**
                 * @type {PairsTab}
                 */
                this.tab = null;

                /**
                 * @type {Array}
                 * @private
                 */
                this.tabsData = [];

                /**
                 * @type {Array}
                 * @private
                 */
                this.dropDownData = [];

                /**
                 * @type {string}
                 */
                this.search = '';

                /**
                 * @type {*[]}
                 */
                this.headers = [
                    {
                        id: 'favourite',
                        templatePath: 'modules/dex/directives/dexWatchlist/FavouritesColumnHeader.html',
                        scopeData: {
                            toggleOnlyFavourite: () => {
                                this.toggleOnlyFavourite();
                            },
                            shouldShowOnlyFavourite: () => {
                                return this.shouldShowOnlyFavourite();
                            }
                        }
                    },
                    {
                        id: 'pair',
                        title: { literal: 'directives.watchlist.pair' },
                        sort: (pairs, shouldSortAscending) => {
                            return this._sortColumn(
                                shouldSortAscending,
                                () => this.tab.sortByPairAscending(),
                                () => this.tab.sortByPairDescending()
                            );
                        }
                    },
                    {
                        id: 'price',
                        title: { literal: 'directives.watchlist.price' },
                        sort: (pairs, shouldSortAscending) => {
                            return this._sortColumn(
                                shouldSortAscending,
                                () => this.tab.sortByPriceAscending(),
                                () => this.tab.sortByPriceDescending()
                            );
                        }
                    },
                    {
                        id: 'change',
                        title: { literal: 'directives.watchlist.chg' },
                        sort: (pairs, shouldSortAscending) => {
                            return this._sortColumn(
                                shouldSortAscending,
                                () => this.tab.sortByChangeAscending(),
                                () => this.tab.sortByChangeDescending()
                            );
                        }
                    },
                    {
                        id: 'volume',
                        title: { literal: 'directives.watchlist.volume' },
                        sort: (pairs, shouldSortAscending) => {
                            return this._sortColumn(
                                shouldSortAscending,
                                () => this.tab.sortByVolumeAscending(),
                                () => this.tab.sortByVolumeDescending()
                            );

                        }
                    },
                    {
                        id: 'info'
                    }
                ];

                /**
                 * @type {string[]}
                 * @private
                 */
                this._chosenPair = null;

                /**
                 * @type {Array<string>}
                 * @private
                 */
                this._assetsIds = [];

                /**
                 * @type {{amount: string, price: string}}
                 * @private
                 */
                this._assetIdPair = null;

                /**
                 * @type {boolean}
                 * @private
                 */
                this.searchInProgress = false;

                /**
                 * @type {boolean}
                 * @private
                 */
                this._shouldShowOnlyFavourite = false;

                /**
                 * @type {{}}
                 * @private
                 */
                this._favourite = {};
            }

            $postLink() {
                this.syncSettings({
                    _favourite: 'dex.watchlist.favourite',
                    _assetsIds: 'dex.watchlist.list',
                    _assetIdPair: 'dex.assetIdPair'
                });

                this._prepareTabs();
                this.tab = this.tabs.getChosenTab();
                this._chooseInitialPair();

                this.observe('search', this._applyFilteringAndPrepareSearchResults);
                this.observe('_chosenPair', this._switchLocationAndUpdateAssetIdPair);
            }

            /**
             * @param pair
             */
            choosePair(pair) {
                this._simplyChoosePair(pair);
                this._updateVisiblePairsData();
            }

            /**
             * @param tabData
             */
            chooseTab(tabData) {
                this.tabs.switchTabTo(tabData.id).then(() => {
                    this._updateVisiblePairsData();
                });

                this.tab = this.tabs.getChosenTab();
                this._prepareSearchResults();
            }

            /**
             * @param tabData
             * @returns {boolean}
             */
            isActive(tabData) {
                return this.tab.isBasedOn(tabData);
            }

            /**
             * @param pair
             * @returns {boolean}
             */
            isChosen(pair) {
                return this.tab.isChosen(pair);
            }

            /**
             * @param pair
             * @returns {Boolean}
             */
            isFavourite(pair) {
                return this.tab.isFavourite(pair);
            }

            /**
             * @param {string} change
             * @returns {boolean}
             */
            isNegative(change) {
                return parseFloat(change) < 0;
            }

            /**
             * @param {string} change
             * @returns {boolean}
             */
            isPositive(change) {
                return parseFloat(change) > 0;
            }

            /**
             * @returns {boolean}
             */
            shouldShowOnlyFavourite() {
                return this._shouldShowOnlyFavourite;
            }

            /**
             * @param $event
             * @param pair
             */
            toggleFavourite($event, pair) {
                $event.stopPropagation();

                this.tab.toggleFavourite(pair)
                    .then(() => {
                        this._updateVisiblePairsData();
                    });

                this._saveFavouriteForTab(this.tab.id, this.tab.getFavourite());
            }

            _saveFavouriteForTab(tabId, favouritePairsOfIds) {
                // This order of operations is required for proper work of synchronization of settings.
                const favourite = tsUtils.cloneDeep(this._favourite);
                favourite[tabId] = favouritePairsOfIds;
                this._favourite = favourite;
            }

            toggleOnlyFavourite() {
                this._shouldShowOnlyFavourite = !this._shouldShowOnlyFavourite;
                this._updateVisiblePairsData();
            }

            /**
             * @private
             */
            _applyFilteringAndPrepareSearchResults() {
                // Applies filter.
                this._updateVisiblePairsData();

                this._prepareSearchResults();
            }

            /**
             * @param assetId
             * @param assetIds
             * @returns {Array}
             * @private
             */
            _buildPairsRelativeTo(assetId, assetIds) {
                const pairs = [];

                assetIds.forEach((id) => {
                    if (assetId === id) {
                        return;
                    }

                    pairs.push([assetId, id]);
                });

                return pairs;
            }

            /**
             * @private
             */
            _chooseInitialPair() {
                this._simplyChoosePair(this.tab.getChosenPair() || this.tab.getDefaultPair());
                this._switchLocationAndUpdateAssetIdPair();
            }

            /**
             * @param assetId
             * @param tabId
             * @returns {Array}
             * @private
             */
            _getFavouritePairsRelativeTo(assetId, tabId = assetId) {
                const savedFavourite = this._getSavedFavourite(tabId);

                if (savedFavourite) {
                    return savedFavourite;
                }

                const allGateways = Object.assign({}, { WAVES: '' }, gateways, sepaGateways);
                const pairsRelativeToAsset = this._buildPairsRelativeTo(assetId, Object.keys(allGateways));
                this._saveFavouriteForTab(tabId, pairsRelativeToAsset);

                return pairsRelativeToAsset;
            }

            /**
             * @returns {Array}
             * @private
             */
            _getOtherPairs() {
                const otherPairs = [];

                this._assetsIds.forEach((assetId, index) => {
                    this._assetsIds
                        .slice(index + 1)
                        .forEach((anotherAssetId) => {
                            otherPairs.push([assetId, anotherAssetId]);
                        });
                });

                return otherPairs;
            }

            /**
             * @param assetId
             * @returns {Array}
             * @private
             */
            _getOtherPairsRelativeTo(assetId) {
                return this._buildPairsRelativeTo(assetId, this._assetsIds);
            }

            _getSearchQuery() {
                return `${this.tab.getSearchPrefix()}${this.search}`;
            }

            /**
             * @returns {*}
             * @private
             */
            _prepareSearchResults() {
                if (!this.search) {
                    this.tab.clearSearchResults();
                    this._updateVisiblePairsData();
                    this.searchInProgress = false;
                    return;
                }

                this.searchInProgress = true;

                WatchlistSearch.search(this._getSearchQuery())
                    .then((searchResults) => {
                        this.searchInProgress = !searchResults.searchFinished;

                        return this.tab.setSearchResults(searchResults.results)
                            .then(() => {
                                this._updateVisiblePairsData();
                            });
                    });
            }

            /**
             * @param assetName
             * @returns {{title: *, id: *, pairsOfIds: {favourite: *, other: *[][]}}}
             * @private
             */
            _prepareTabDataForAsset(assetName) {
                const id = WavesApp.defaultAssets[assetName];

                return {
                    title: assetName,
                    id,
                    searchPrefix: `${id}/`,
                    pairsOfIds: {
                        favourite: this._getFavouritePairsRelativeTo(id),
                        other: this._getOtherPairsRelativeTo(id)
                    }
                };
            }

            /**
             * @param assetsNames
             * @returns {*}
             * @private
             */
            _prepareTabDataForAssets(assetsNames) {
                return assetsNames.map((assetName) => this._prepareTabDataForAsset(assetName));
            }

            /**
             * @private
             */
            _prepareTabs() {
                const ALL = 'All';

                this.tabsData = [
                    {
                        title: ALL,
                        id: ALL,
                        searchPrefix: '',
                        pairsOfIds: {
                            favourite: this._getFavouritePairsRelativeTo(WavesApp.defaultAssets.WAVES, ALL),
                            other: this._getOtherPairs(),
                            chosen: DexWatchlist._getPairFromState()
                        }
                    },
                    ...this._prepareTabDataForAssets(TABS_ASSETS)
                ];

                const allTabs = TABS_ASSETS.concat(DROP_DOWN_ASSETS);
                const otherTabs = (
                    Object
                        .keys(WavesApp.defaultAssets)
                        .filter((defaultAsset) => !allTabs.includes(defaultAsset))
                );
                this.dropDownData = [...this._prepareTabDataForAssets(DROP_DOWN_ASSETS.concat(otherTabs))];

                this.tabs
                    .addPairs([...this.tabsData, ...this.dropDownData])
                    .then(() => {
                        this._updateVisiblePairsData();
                    });
            }


            /**
             * @param tabId
             * @returns {{}|*|null}
             * @private
             */
            _getSavedFavourite(tabId) {
                return (
                    this._favourite &&
                    this._favourite[tabId]
                ) || null;
            }

            /**
             * @param pair
             * @private
             */
            _simplyChoosePair(pair) {
                this.tab.choosePair(pair);
                this._chosenPair = pair;
            }

            /**
             * @param shouldSortAscending
             * @param sortAscending
             * @param sortDescending
             * @returns {any[]}
             * @private
             */
            _sortColumn(shouldSortAscending, sortAscending, sortDescending) {
                if (shouldSortAscending) {
                    sortAscending();
                } else {
                    sortDescending();
                }

                return this.tab.getVisiblePairs(this._shouldShowOnlyFavourite);
            }

            /**
             * @private
             */
            _switchLocationAndUpdateAssetIdPair() {
                $location.search('assetId1', this._chosenPair.pairOfIds[0]);
                $location.search('assetId2', this._chosenPair.pairOfIds[1]);

                this._chosenPair.amountAndPriceRequest.then(() => {
                    this._assetIdPair = {
                        amount: this._chosenPair.amountAsset.id,
                        price: this._chosenPair.priceAsset.id
                    };
                });
            }

            /**
             * @private
             */
            _updateVisiblePairsData() {
                WatchlistSearch.filter(
                    this.tab.getReconstructedVisiblePairs(this._shouldShowOnlyFavourite),
                    this._getSearchQuery()
                )
                    .then((filterResults) => {
                        this.visiblePairsData = filterResults;
                        $scope.$digest();
                    });
            }

            /**
             * @returns {*}
             * @private
             */
            static _getPairFromState() {
                const { assetId1, assetId2 } = $state.params;

                if (assetId1 && assetId2) {
                    return [
                        $state.params.assetId1,
                        $state.params.assetId2
                    ];
                }

                return null;
            }

        }

        return new DexWatchlist();
    };

    controller.$inject = [
        'Base',
        'waves',
        'user',
        '$scope',
        '$state',
        '$location',
        'decorators',
        'gateways',
        'sepaGateways',
        'PairData',
        'PairsList',
        'PairsTabs',
        'WatchlistSearch'
    ];

    angular.module('app.dex')
        .component('wDexWatchlist', {
            templateUrl: 'modules/dex/directives/dexWatchlist/DexWatchlist.html',
            controller
        });
})();

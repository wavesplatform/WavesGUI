(function () {
    'use strict';

    /**
     * @param Base
     * @param {Waves} waves
     * @param {$rootScope.Scope} $scope
     * @param {$state} $state
     * @param {$location} $location
     * @param {app.utils.decorators} decorators
     * @param gateways
     * @param sepaGateways
     * @param PairData
     * @param PairsList
     * @param PairsTab
     * @param WatchlistSearch
     * @return {DexWatchlist}
     */
    const controller = function (
        Base,
        waves,
        $scope,
        $state,
        $location,
        decorators,
        gateways,
        sepaGateways,
        PairData,
        PairsList,
        PairsTab,
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
                 * @type {string}
                 * @private
                 */
                this.baseAssetId = null;

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
                        sort: true
                    },
                    {
                        id: 'price',
                        title: { literal: 'directives.watchlist.price' },
                        sort: true
                    },
                    {
                        id: 'change',
                        title: { literal: 'directives.watchlist.chg' },
                        sort: true
                    },
                    {
                        id: 'volume',
                        title: { literal: 'directives.watchlist.volume' },
                        sort: true
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
                 * @type {PairsTab}
                 */
                this.tab = new PairsTab();

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
                this._shouldShowOnlyFavourite = false;
            }

            $postLink() {
                this.syncSettings({
                    baseAssetId: 'dex.watchlist.baseAssetId',
                    _assetsIds: 'dex.watchlist.list',
                    _assetIdPair: 'dex.assetIdPair'
                });

                this.tab.activate({
                    favourite: this._getFavouritePairs(),
                    other: this._getOtherPairs(),
                    chosen: DexWatchlist._getPairFromState()
                }).then(() => {
                    this._updateVisiblePairsData();
                });

                this._choseInitialPair();

                this.observe('search', this._prepareSearchResults);
                this.observe('_chosenPair', this._switchLocationAndUpdateAssetIdPair);
            }

            /**
             * @private
             */
            _getFavouritePairs() {
                const allGateways = Object.assign({}, gateways, sepaGateways);
                return Object.keys(allGateways).map((gatewayId) => {
                    return ([WavesApp.defaultAssets.WAVES, gatewayId]);
                });
            }

            /**
             * @private
             */
            _getOtherPairs() {
                const otherPairs = [];

                this._assetsIds.forEach((assetId, index) => {
                    return this._assetsIds
                        .slice(index + 1)
                        .forEach((anotherAssetId) => {
                            otherPairs.push([assetId, anotherAssetId]);
                        });
                });

                return otherPairs;
            }

            /**
             * @private
             */
            _choseInitialPair() {
                this.chosePair(this.tab.getChosenPair() || this.tab.getDefaultPair());
                this._switchLocationAndUpdateAssetIdPair();
            }

            /**
             * @private
             */
            _prepareSearchResults({ value }) {
                WatchlistSearch.search(value)
                    .then((searchResults) => {
                        this.tab.clearSearchResults();

                        this.tab.addSearchResults(searchResults.results)
                            .then(() => {
                                this._updateVisiblePairsData();
                            });
                    });

                // Applies filter.
                this._updateVisiblePairsData();
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

            _updateVisiblePairsData() {
                WatchlistSearch.filter(this.tab.getVisiblePairs(this._shouldShowOnlyFavourite), this.search)
                    .then((filterResults) => {
                        this.visiblePairsData = filterResults;
                        $scope.$digest();
                    });
            }

            toggleOnlyFavourite() {
                this._shouldShowOnlyFavourite = !this._shouldShowOnlyFavourite;
                this._updateVisiblePairsData();
            }

            /**
             * @returns {boolean}
             */
            shouldShowOnlyFavourite() {
                return this._shouldShowOnlyFavourite;
            }

            /**
             * @param pair
             */
            chosePair(pair) {
                this.tab.chosePair(pair);
                this._updateVisiblePairsData();
                this._chosenPair = pair;
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
             * @param $event
             * @param pair
             */
            toggleFavourite($event, pair) {
                $event.stopPropagation();

                this.tab.toggleFavourite(pair)
                    .then(() => {
                        this._updateVisiblePairsData();
                    });
            }

            /**
             * @param {string} change
             * @returns {boolean}
             */
            isPositive(change) {
                return parseFloat(change) > 0;
            }

            /**
             * @param {string} change
             * @returns {boolean}
             */
            isNegative(change) {
                return parseFloat(change) < 0;
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
        '$scope',
        '$state',
        '$location',
        'decorators',
        'gateways',
        'sepaGateways',
        'PairData',
        'PairsList',
        'PairsTab',
        'WatchlistSearch'
    ];

    angular.module('app.dex')
        .component('wDexWatchlist', {
            templateUrl: 'modules/dex/directives/dexWatchlist/DexWatchlist.html',
            controller
        });
})();

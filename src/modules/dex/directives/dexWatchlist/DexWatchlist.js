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
     * @param PairList
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
        PairList,
        WatchlistSearch
    ) {

        class DexWatchlist extends Base {

            constructor() {
                super();

                /**
                 * @type {Array}
                 */
                this.pairsData = [];

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
                 * @private
                 */
                this._favourite = new PairList();


                /**
                 * @private
                 */
                this._other = new PairList();

                /**
                 * @private
                 */
                this._wandering = new PairList();

                /**
                 * @private
                 */
                this._searchResults = new PairList();

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

                this._setFavouritePairs();
                this._setOtherPairs();
                this._setWanderingPair();
                // todo: reconstruct to prevent rows jumps.
                this._updatePairsData();

                Promise.all([
                    this._favourite.pairsSorted,
                    this._other.pairsSorted,
                    this._wandering.pairsSorted
                ]).then(() => {
                    this._updatePairsData();
                });

                this._resolveState().then(() => {
                    this.observe('search', this._prepareSearchResults);
                    this.observe('_chosenPair', this._switchLocationAndUpdateAssetIdPair);

                    $scope.$digest();
                });
            }

            /**
             * @private
             */
            _setFavouritePairs() {
                const allGateways = Object.assign({}, gateways, sepaGateways);
                Object.keys(allGateways).forEach((gatewayId) => {
                    this._favourite.addPairOfIds([WavesApp.defaultAssets.WAVES, gatewayId]);
                });

                this._favourite.sortOnceVolumesLoaded();
            }

            /**
             * @private
             */
            _setOtherPairs() {
                this._assetsIds.forEach((assetId, index) => {
                    return this._assetsIds
                        .slice(index + 1)
                        .forEach((anotherAssetId) => {
                            if (this._isFavouritePairOfIds([assetId, anotherAssetId])) {
                                return false;
                            }

                            this._other.addPairOfIds([assetId, anotherAssetId]);
                        });
                });

                this._other.sortOnceVolumesLoaded();
            }

            /**
             * @private
             */
            _setWanderingPair() {
                const pairFromState = DexWatchlist._getPairFromState();

                if (!pairFromState) {
                    return;
                }

                if (this._isFavouritePairOfIds(pairFromState) || this._isOtherPairOfIds(pairFromState)) {
                    return;
                }

                this._wandering.addPairOfIds(pairFromState);

                this._wandering.sortOnceVolumesLoaded();
            }

            /**
             * @returns {Promise}
             * @private
             */
            _resolveState() {
                const pairFromState = DexWatchlist._getPairFromState();

                if (!pairFromState) {
                    this._setDefaultPair();
                    return Promise.resolve();
                }

                return (
                    this._getAndAddPair(...pairFromState)
                        .catch(() => {
                            const { WAVES, BTC } = WavesApp.defaultAssets;

                            return this._getAndAddPair([WAVES, BTC]);
                        })
                );
            }

            _getAndAddPair(pairOfIds) {
                const pairRequest = Waves.AssetPair.get(...pairOfIds);

                pairRequest.then((pair) => {
                    this._addNewPair([pair.amountAsset.id, pair.priceAsset.id]);
                });

                return pairRequest;
            }

            /**
             * @private
             */
            _prepareSearchResults({ value }) {
                WatchlistSearch.search(value)
                    .then((pairs) => {
                        this._searchResults.clear();

                        pairs.results.forEach((pair) => {
                            if (this._isKnownPairOfIds(pair)) {
                                return;
                            }

                            this._searchResults.addPairOfIds(pair);
                        });

                        this._searchResults.sortOnceVolumesLoaded();

                        this._searchResults.pairsSorted.then(() => {
                            this._updatePairsData();
                        });
                    });
            }

            /**
             * @param pairOfIds
             * @returns {boolean}
             * @private
             */
            _isKnownPairOfIds(pairOfIds) {
                return (
                    this._isFavouritePairOfIds(pairOfIds) ||
                    this._isOtherPairOfIds(pairOfIds) ||
                    this._wandering.includesPairOfIds(pairOfIds)
                );
            }

            /**
             * @param pairOfIds
             * @returns {boolean}
             * @private
             */
            _isFavouritePairOfIds(pairOfIds) {
                return this._favourite.includesPairOfIds(pairOfIds);
            }

            /**
             * @param pairOfIds
             * @returns {boolean}
             * @private
             */
            _isOtherPairOfIds(pairOfIds) {
                return this._other.includesPairOfIds(pairOfIds);
            }

            /**
             * @private
             */
            _switchLocationAndUpdateAssetIdPair() {
                this._switchLocationToChosenPair();
                this._assetIdPair = {
                    amount: this._chosenPair.amountId,
                    price: this._chosenPair.priceId
                };
            }

            /**
             * @private
             */
            _setDefaultPair() {
                this._chosenPair = this.pairsData[0];
            }

            /**
             * @private
             */
            _switchLocationToChosenPair() {
                $location.search('assetId1', this._chosenPair.pairOfIds[0]);
                $location.search('assetId2', this._chosenPair.pairOfIds[1]);
            }

            /**
             * @private
             */
            _updatePairsData() {
                const favouritePairsData = this._favourite.getPairsData();

                // todo: move 30 to settings.
                this.pairsData = [
                    ...favouritePairsData
                ];

                if (!this.shouldShowOnlyFavourite()) {
                    this.pairsData.push(
                        ...this._other.getPairsData().slice(0, 30 - favouritePairsData.length),
                        ...this._wandering.getPairsData()
                    );
                }

                this.pairsData.push(
                    ...this._searchResults.getPairsData().slice(0, 10)
                );
            }

            toggleOnlyFavourite() {
                this._shouldShowOnlyFavourite = !this._shouldShowOnlyFavourite;
                this._updatePairsData();
            }

            /**
             * @returns {boolean}
             */
            shouldShowOnlyFavourite() {
                return this._shouldShowOnlyFavourite;
            }

            /**
             * @param pairOfIds
             * @private
             */
            _addNewPair(pairOfIds) {
                let wanderingPair = this._getKnownPairDataBy(pairOfIds);
                if (!wanderingPair) {
                    this._updateWanderingPairs(pairOfIds);

                    wanderingPair = this._wandering.getPairsData()[0];
                }

                return wanderingPair.amountAndPriceRequest.then(() => {
                    this.choosePair(wanderingPair);
                });
            }

            /**
             * @param pair
             */
            choosePair(pair) {
                if (pair !== this._wandering.getPairsData()[0]) {
                    this._updateWanderingPairs();
                }

                this._chosenPair = pair;
            }

            /**
             * @param pairOfIds
             * @private
             */
            _updateWanderingPairs(pairOfIds) {
                this._wandering.clear();
                if (pairOfIds) {
                    this._wandering.addPairOfIds(pairOfIds);
                }
                this._updatePairsData();
            }

            /**
             * @param pair
             * @returns {boolean}
             */
            isSelected(pair) {
                return pair === this._chosenPair;
            }

            /**
             * @param pair
             * @returns {Boolean}
             */
            isFavourite(pair) {
                return this._favourite.includes(pair);
            }

            /**
             * @param $event
             * @param pair
             */
            toggleFavourite($event, pair) {
                $event.stopPropagation();

                if (this.isFavourite(pair)) {
                    this._exchangePair([this._favourite], this._other, pair);
                } else {
                    this._exchangePair([this._other, this._wandering, this._searchResults], this._favourite, pair);
                }
            }

            _exchangePair(donors, recipient, pair) {
                donors.forEach((donor) => {
                    donor.removePair(pair);
                });
                recipient.addPair(pair)
                    .then(() => {
                        this._updatePairsData();
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
             * @param pairOfIds
             * @returns {*}
             * @private
             */
            _getKnownPairDataBy(pairOfIds) {
                return (
                    this.pairsData
                        .reduce((knownPairData, somePairData) => {
                            if (this._areEqualPairs(somePairData.pairOfIds, pairOfIds)) {
                                knownPairData = somePairData;
                            }

                            return knownPairData;
                        }, null)
                );
            }

            _areEqualPairs(pair, anotherPair) {
                return pair.reduce((isKnownPair, id) => isKnownPair && anotherPair.includes(id), true);
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
        'PairList',
        'WatchlistSearch'
    ];

    angular.module('app.dex')
        .component('wDexWatchlist', {
            templateUrl: 'modules/dex/directives/dexWatchlist/DexWatchlist.html',
            controller
        });
})();

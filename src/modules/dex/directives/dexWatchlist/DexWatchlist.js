(function () {
    'use strict';

    const NAME_STUB = '—';

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
        PairList
    ) {

        class DexWatchlist extends Base {

            constructor() {
                super();

                /**
                 * @type {Array}
                 */
                this.pairsData = [];

                /**
                 * @type {Array}
                 */
                this.assetSearchResults = [];

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
                 * Active xhr from find assets request.
                 * @type {JQueryXHR}
                 * @private
                 */
                this._assetSearchInProgress = null;

                /**
                 * Id of timeout for input
                 * @type {number}
                 * @private
                 */
                this._assetSearchDelay = null;

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

                if (this._isFavouritePairOfIds(pairFromState) || this._isOther(pairFromState)) {
                    return;
                }

                this._wandering.addPairOfIds(pairFromState);

                this._wandering.sortOnceVolumesLoaded();
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
            _isOther(pairOfIds) {
                return this._other.includesPairOfIds(pairOfIds);
            }

            /**
             * @returns {Promise}
             * @private
             */
            _resolveState() {
                const pairFromState = DexWatchlist._getPairFromState();

                if (!pairFromState) {
                    this._setDefaultPair();
                    this._switchLocationToChosenPair();
                    return Promise.resolve();
                }

                return DexWatchlist._getPair(...pairFromState)
                    .then((pair) => {
                        this._setPairAndAddToAssetsIds(pair);
                    })
                    .catch(() => {
                        const { WAVES, BTC } = WavesApp.defaultAssets;

                        return DexWatchlist._getPair(WAVES, BTC)
                            .then((pair) => {
                                this._setPairAndAddToAssetsIds(pair);
                                this._switchLocationToChosenPair();
                            });
                    });
            }

            /**
             * @param pair
             * @private
             */
            _setPairAndAddToAssetsIds(pair) {
                this._chooseExistingPair([pair.amountAsset.id, pair.priceAsset.id]);
            }

            /**
             * @param value
             * @private
             */
            _prepareSearchResults({ value }) {
                if (this._assetSearchInProgress) {
                    this._assetSearchInProgress.abort();
                    this._assetSearchInProgress = null;
                }

                if (this._assetSearchDelay) {
                    clearTimeout(this._assetSearchDelay);
                    this._assetSearchDelay = null;
                }

                if (!value.length) {
                    this._clearSearchResults();
                    this.nothingFound = false;
                    return;
                }

                this._assetSearchDelay = setTimeout(() => {
                    this._assetSearchInProgress = waves.node.assets.search(value);
                    this._assetSearchInProgress
                        .then((searchResults) => {
                            this.assetSearchResults = (
                                searchResults
                                    .filter((searchResult) => searchResult.id !== this.baseAssetId)
                                    .map((searchResult) => {
                                        const { id, ticker, name } = searchResult;

                                        return {
                                            id,
                                            isWatched: this._assetsIds.some((assetId) => assetId === id),
                                            ticker: DexWatchlist._getInputPartAndRemainder(value, ticker),
                                            name: DexWatchlist._getInputPartAndRemainder(value, name)
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

                            this._setNothingFound();
                            $scope.$digest();
                        }, () => {
                            this._clearSearchResults();
                            this._setNothingFound();
                            $scope.$digest();
                        });
                }, 500);
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
            }

            toggleOnlyFavourite() {
                this._shouldShowOnlyFavourite = !this._shouldShowOnlyFavourite;
                this._updatePairsData();
            }

            shouldShowOnlyFavourite() {
                return this._shouldShowOnlyFavourite;
            }

            /**
             * @returns {boolean}
             */
            shouldShowSearchResults() {
                return Boolean(this.assetSearchResults.length) || this.nothingFound;
            }

            /**
             * @param asset
             */
            addNewPair(asset) {
                const pairOfIds = [WavesApp.defaultAssets.WAVES, asset.id];

                let wanderingPair = this._getKnownPairDataBy(pairOfIds);
                if (!wanderingPair) {
                    this._updateWanderingPairs(pairOfIds);

                    wanderingPair = this._wandering.getPairsData()[0];
                }

                wanderingPair.amountAndPriceRequest.then(() => {
                    this.choosePair(wanderingPair);
                });

                this.search = '';
            }

            _updateWanderingPairs(pairOfIds) {
                this._wandering.clear();
                if (pairOfIds) {
                    this._wandering.addPairOfIds(pairOfIds);
                }
                this._updatePairsData();
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
                    this._exchangePair([this._other, this._wandering], this._favourite, pair);
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
             * @private
             */
            _clearSearchResults() {
                this.assetSearchResults = [];
            }

            /**
             * @private
             */
            _setNothingFound() {
                this.nothingFound = !this.assetSearchResults.length;
            }

            /**
             * @param pairOfIds
             * @private
             */
            _chooseExistingPair(pairOfIds) {
                const knownPair = this._getKnownPairDataBy(pairOfIds);
                this._chosenPair = knownPair || this.pairsData[0];
            }

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

            /**
             * @param {string} assetId
             * @param {string} anotherAssetId
             * @returns {*}
             * @private
             */
            static _getPair(assetId, anotherAssetId) {
                return Waves.AssetPair.get(assetId, anotherAssetId);
            }

            /**
             * @param {string} query
             * @param {string} text
             * @returns {{beginning: string, inputPart: string, ending: string}}
             * @private
             */
            static _getInputPartAndRemainder(query, text = '') {
                const splitMask = new RegExp(`(.*)(${query})(.*)`, 'i');
                const splitResult = splitMask.exec(text) || ['', '', '', NAME_STUB];

                return {
                    beginning: splitResult[1],
                    inputPart: splitResult[2],
                    ending: splitResult[3]
                };
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
        'PairList'
    ];

    angular.module('app.dex')
        .component('wDexWatchlist', {
            templateUrl: 'modules/dex/directives/dexWatchlist/DexWatchlist.html',
            controller
        });
})();

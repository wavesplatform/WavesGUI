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
        PairData
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
                 * @type {Array}
                 * @private
                 */
                this._favouritePairs = [];

                /**
                 * @type {Array}
                 * @private
                 */
                this._otherPairs = [];

                /**
                 * @type {Array}
                 * @private
                 */
                this._wanderingPairs = [];

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
                this._setPairsData();

                this._resolveState().then(() => {
                    this.observe('_assetsIds', this._setPairsData);
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
                    this._favouritePairs.push([WavesApp.defaultAssets.WAVES, gatewayId]);
                });
            }

            /**
             * @private
             */
            _setOtherPairs() {
                this._assetsIds.some((assetId, index) => {
                    return this._assetsIds
                        .slice(index + 1)
                        .some((anotherAssetId) => {
                            if (this._isFavourite([assetId, anotherAssetId])) {
                                return false;
                            }

                            this._otherPairs.push([assetId, anotherAssetId]);

                            // todo: move 30 to settings.
                            return this._otherPairs.length >= 30 - this._favouritePairs.length;
                        });
                });
            }

            /**
             * @private
             */
            _setWanderingPair() {
                const pairFromState = this._getPairFromState();

                if (!pairFromState) {
                    return;
                }

                if (this._isFavourite(pairFromState) || this._isOther(pairFromState)) {
                    return;
                }

                this._wanderingPairs.push(pairFromState);
            }

            /**
             * @param pairOfIds
             * @returns {boolean}
             * @private
             */
            _isFavourite(pairOfIds) {
                return this._isPairFromList(this._favouritePairs, pairOfIds);
            }

            /**
             * @param pairOfIds
             * @returns {boolean}
             * @private
             */
            _isOther(pairOfIds) {
                return this._isPairFromList(this._otherPairs, pairOfIds);
            }

            _isPairFromList(pairList, pairOfIds) {
                return pairList.some((pairFromList) => {
                    return this._areEqualPairs(pairFromList, pairOfIds);
                });
            }

            /**
             * @private
             */
            _setPairsData() {
                const favouriteTopAndWandering = [
                    ...this._favouritePairs,
                    ...this._otherPairs,
                    ...this._wanderingPairs
                ];

                this.pairsData = (
                    favouriteTopAndWandering
                        .map((pairOfIds) => new PairData(pairOfIds))
                        .map((requestAndData) => requestAndData.data)
                );
            }

            /**
             * @returns {Promise}
             * @private
             */
            _resolveState() {
                const pairFromState = this._getPairFromState();

                if (!pairFromState) {
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
             * @returns {*}
             * @private
             */
            _getPairFromState() {
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
             * @param pair
             * @private
             */
            _setPairAndAddToAssetsIds(pair) {
                const amountAssetId = pair.amountAsset.id;
                const priceAssetId = pair.priceAsset.id;

                this._chooseExistingPair([amountAssetId, priceAssetId]);
                this._addToAssetIds([
                    amountAssetId,
                    priceAssetId
                ]);
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

            /**
             * @private
             */
            _switchLocationToChosenPair() {
                $location.search('assetId1', this._chosenPair.amountId);
                $location.search('assetId2', this._chosenPair.priceId);
            }

            /**
             * @returns {boolean}
             */
            shouldShowSearchResults() {
                return Boolean(this.assetSearchResults.length) || this.nothingFound;
            }

            /**
             * @param isChangeBase
             * @param id
             * @private
             */
            addNewPair({ id }) {
                this._addToAssetIds([id]);
                this.search = '';
            }

            /**
             * @param {Array<string>} ids
             * @private
             */
            _addToAssetIds(ids) {
                const uniqueAssetsIds = new Set([
                    ...this._assetsIds,
                    ...ids
                ]);
                this._assetsIds = Array.from(uniqueAssetsIds);
            }

            /**
             * @param pair
             */
            choosePair(pair) {
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
             * @param {string} query
             * @param {string} text
             * @returns {{beginning: string, inputPart: string, ending: string}}
             * @private
             */
            static _getInputPartAndRemainder(query, text) {
                const splitMask = new RegExp(`(.*)(${query})(.*)`, 'i');
                const splitResult = splitMask.exec(text) || ['', '', '', NAME_STUB];

                return {
                    beginning: splitResult[1],
                    inputPart: splitResult[2],
                    ending: splitResult[3]
                };
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
        'PairData'
    ];

    angular.module('app.dex')
        .component('wDexWatchlist', {
            templateUrl: 'modules/dex/directives/dexWatchlist/DexWatchlist.html',
            controller
        });
})();

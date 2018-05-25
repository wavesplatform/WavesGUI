(function () {
    'use strict';

    const NAME_STUB = '—';

    /**
     * @param Base
     * @param {Waves} waves
     * @param {app.utils} utils
     * @param {JQuery} $element
     * @param {$rootScope.Scope} $scope
     * @param {$state} $state
     * @param {$location} $location
     * @param {app.utils.decorators} decorators
     * @return {DexWatchlist}
     */
    const controller = function (Base, waves, utils, $element, $scope, $state, $location, decorators) {

        class DexWatchlist extends Base {

            constructor() {
                super();

                /**
                 * @type {Array<Asset>}
                 */
                this.assets = null;

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
                 * @type {string}
                 */
                this.secondaryAssetId = null;

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
                        id: 'info',
                        title: { literal: 'directives.watchlist.volume' }
                    }
                ];

                /**
                 * @type {Array<string>}
                 * @private
                 */
                this._assetsIds = null;

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

                this._resolveState().then(() => {
                    this.observe('baseAssetId', this._onChangeBaseAsset);
                    this.observe('secondaryAssetId', this._onChangeSecondaryAsset);
                    this.observe('_assetsIds', this._onChangeAssetsIds);
                    this.observe('_assetIdPair', this._switchLocationToCurrentPair);
                    this.observe('search', this._onChangeSearch);

                    this._onChangeBaseAsset();
                    this._initSecondaryAssetId();
                    this._onChangeAssetsIds();

                    $scope.$digest();
                });
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
            addSecondaryAsset({ id }) {
                this._addToAssetIds([id]);
                this.secondaryAssetId = id;
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
             * @param {string} secondaryAssetId
             */
            changePair(secondaryAssetId) {
                this.secondaryAssetId = secondaryAssetId;
            }

            /**
             * @param {string} id
             * @returns {boolean}
             */
            isSelected(id) {
                return id === this.secondaryAssetId;
            }

            /**
             * @param value
             * @private
             */
            _onChangeSearch({ value }) {
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
                                            isWatched: this.assets.some((asset) => asset.id === id),
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
             * @returns {Promise}
             * @private
             */
            _resolveState() {
                const { assetId1, assetId2 } = $state.params;

                if (!(assetId1 && assetId2)) {
                    this._switchLocationToCurrentPair();
                    return Promise.resolve();
                }

                return DexWatchlist._getPair(assetId1, assetId2)
                    .then((pair) => {
                        this._setAssetIdPairAndAddToAssetsIds(pair);
                    })
                    .catch(() => {
                        const { WAVES, BTC } = WavesApp.defaultAssets;

                        return DexWatchlist._getPair(WAVES, BTC)
                            .then((pair) => {
                                this._setAssetIdPairAndAddToAssetsIds(pair);
                                this._switchLocationToCurrentPair();
                            });
                    });
            }

            /**
             * @private
             */
            _switchLocationToCurrentPair() {
                $location.search('assetId1', this._assetIdPair.price);
                $location.search('assetId2', this._assetIdPair.amount);
            }

            /**
             * @param pair
             * @private
             */
            _setAssetIdPairAndAddToAssetsIds(pair) {
                this._setAssetIdPair(pair);
                this._addToAssetIds([
                    pair.amountAsset.id,
                    pair.priceAsset.id
                ]);
            }

            /**
             * @private
             */
            _onChangeBaseAsset() {
                this._activateAssets();
            }

            /**
             * @return {null}
             * @private
             */
            _activateAssets() {
                this.secondaryAssetId = this.secondaryAssetId || this._assetsIds[0];
                this._setNewAssetPair();
            }

            /**
             * @param pair
             * @private
             */
            _setAssetIdPair(pair) {
                this._assetIdPair = {
                    amount: pair.amountAsset.id,
                    price: pair.priceAsset.id
                };
            }

            /**
             * @return {null}
             * @private
             */
            _onChangeSecondaryAsset() {
                if (!this.secondaryAssetId) {
                    return null;
                }
                this._setNewAssetPair();
            }

            /**
             * @private
             */
            @decorators.async()
            _setNewAssetPair() {
                DexWatchlist._getPair(this.baseAssetId, this.secondaryAssetId)
                    .then((pair) => {
                        this._setAssetIdPair(pair);
                    });
            }

            /**
             * @private
             */
            _onChangeAssetsIds() {
                utils.whenAll(this._assetsIds.map(waves.node.assets.info))
                    .then((list) => {
                        this.assets = list;
                        $scope.$digest();
                    });
            }

            /**
             * @private
             */
            _initSecondaryAssetId() {
                if (this._assetIdPair.amount === this.baseAssetId) {
                    this.secondaryAssetId = this._assetIdPair.price;
                } else {
                    this.secondaryAssetId = this._assetIdPair.amount;
                }
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

    controller.$inject = ['Base', 'waves', 'utils', '$element', '$scope', '$state', '$location', 'decorators'];

    angular.module('app.dex')
        .component('wDexWatchlist', {
            templateUrl: 'modules/dex/directives/dexWatchlist/DexWatchlist.html',
            controller
        });
})();

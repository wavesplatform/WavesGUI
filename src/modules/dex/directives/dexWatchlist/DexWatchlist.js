(function () {
    'use strict';

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

            get active() {
                return this._id === this._activeWatchListId;
            }

            constructor() {
                super();
                /**
                 * @type {Array<Asset>}
                 */
                this.watchlist = null;
                /**
                 * @type {string}
                 */
                this.activeRowId = null;

                /**
                 * @type {Array<string>}
                 * @private
                 */
                this._idWatchList = null;
                /**
                 * List of finded assets from api
                 * @type {JQuery}
                 */
                this._$searchList = null;
                /**
                 * Active xhr from find assets request
                 * @type {JQueryXHR}
                 * @private
                 */
                this._activeXHR = null;
                /**
                 * Id of timeout for input
                 * @type {number}
                 * @private
                 */
                this._findTimer = null;
                /**
                 * @type {string}
                 * @private
                 */
                this._id = null;
                /**
                 * @type {string}
                 * @private
                 */
                this._activeWatchListId = null;
                /**
                 * @type {string}
                 * @private
                 */
                this.baseAssetId = null;
                /**
                 * @type {DexBlock}
                 * @private
                 */
                this._parent = null;
                /**
                 * @type {{amount: string, price: string}}
                 * @private
                 */
                this._assetIdPair = null;
            }

            $postLink() {
                if (!this._parent || !this._id) {
                    throw new Error('Wrong directive params!');
                }

                this._$searchList = $element.find('.search-list');

                this.receive(utils.observe(this._parent, 'focused'), this._onChangeSearchFocus, this);
                this.receive(utils.observe(this._parent, 'search'), this._onChangeSearch, this);

                this.syncSettings({
                    _idWatchList: `dex.watchlist.${this._id}.list`,
                    _assetIdPair: 'dex.assetIdPair',
                    baseAssetId: `dex.watchlist.${this._id}.baseAssetId`,
                    _activeWatchListId: 'dex.watchlist.activeWatchListId'
                });

                this._resolveState().then(() => {
                    this.observe('_assetIdPair', () => {
                        if (this.active) {
                            $location.search('assetId2', this._assetIdPair.amount);
                            $location.search('assetId1', this._assetIdPair.price);
                        }
                    });
                    this.observe('activeRowId', this._onChangeActiveRow);
                    this.observe('baseAssetId', this._onChangeBaseAsset);
                    this.observe('_idWatchList', this._onChangeIdWatchList);
                    this.observe('_activeWatchListId', this._onChangeActiveWatchList);

                    this._initRowId();
                    this._onChangeBaseAsset();
                    this._onChangeIdWatchList();

                    $scope.$digest();
                });
            }

            removeWatchedAsset(event, asset) {
                event.preventDefault();
                event.stopPropagation();
                this._idWatchList = this._idWatchList.slice().filter((id) => id !== asset.id);
                if (this.activeRowId === asset.id) {
                    this.activeRowId = this._idWatchList[0];
                }
            }

            /**
             * @param value
             * @private
             */
            _onChangeSearchFocus({ value }) {
                const state = !value || !this._$searchList.children().length;
                this._$searchList.toggleClass('hidden', state);
            }

            /**
             * @returns {Promise}
             * @private
             */
            _resolveState() {
                if (!this.active) {
                    return Promise.resolve();
                }
                if ($state.params.assetId1 && $state.params.assetId2) {
                    return Waves.AssetPair.get($state.params.assetId1, $state.params.assetId2)
                        .then((pair) => {
                            this._assetIdPair = {
                                amount: pair.amountAsset.id,
                                price: pair.priceAsset.id
                            };
                            const list = this._idWatchList.slice();
                            utils.addUniqueToArray([pair.amountAsset.id, pair.priceAsset.id], list);
                            this._idWatchList = list;
                        }).catch(() => {
                            return Waves.AssetPair.get(WavesApp.defaultAssets.WAVES, WavesApp.defaultAssets.BTC)
                                .then((pair) => {
                                    this._assetIdPair = {
                                        amount: pair.amountAsset.id,
                                        price: pair.priceAsset.id
                                    };
                                    $location.search('assetId2', pair.amountAsset.id);
                                    $location.search('assetId1', pair.priceAsset.id);
                                    const list = this._idWatchList.slice();
                                    utils.addUniqueToArray([pair.amountAsset.id, pair.priceAsset.id], list);
                                    this._idWatchList = list;
                                });
                        });
                } else {
                    $location.search('assetId2', this._assetIdPair.amount);
                    $location.search('assetId1', this._assetIdPair.price);
                    return Promise.resolve();
                }
            }

            /**
             * @param value
             * @private
             */
            _onChangeSearch({ value }) {
                if (this._activeXHR) {
                    this._activeXHR.abort();
                    this._activeXHR = null;
                }
                if (value.length) {
                    if (this._findTimer) {
                        clearTimeout(this._findTimer);
                        this._findTimer = null;
                    }
                    this._findTimer = setTimeout(() => {
                        this._activeXHR = waves.node.assets.search(value);
                        this._activeXHR.then((data) => {
                            const isChangeBase = this._parent.changeBaseAssetMode;
                            const assetsHash = utils.toHash(this.watchlist, 'id');
                            data = data.filter((item) => item.id !== this.baseAssetId);
                            /**
                             * @type {JQuery[]}
                             */
                            const $elements = data.map(DexWatchlist._selectQuery(value));
                            $elements.forEach(($element, i) => {
                                const dataItem = data[i];
                                const isWatched = !isChangeBase && !!assetsHash[dataItem.id];
                                const itemClass = assetsHash[dataItem.id] ? 'remove' : 'add';
                                const $control = $(`<div class="${itemClass}"></div>`);
                                $element.toggleClass('watched', isWatched);
                                $element.append($control);
                                $element.on('mousedown', () => this._clickSearchItem(data[i], isChangeBase, isWatched));
                            });
                            this._$searchList.empty();
                            this._$searchList.append($elements);
                            this._onChangeSearchFocus({ value: this._parent.focused });
                        }, () => {
                            this._$searchList.empty();
                            this._$searchList
                                .append('<div class="not-found footnote-1 basic-500">No assets found</div>');
                            this._onChangeSearchFocus({ value: this._parent.focused });
                        });
                    }, 500);
                } else {
                    this._$searchList.empty();
                    this._onChangeSearchFocus({ value: this._parent.focused });
                }
            }

            /**
             * @param id
             * @param isChangeBase
             * @param isWatched
             * @private
             */
            _clickSearchItem({ id }, isChangeBase, isWatched) {
                if (isChangeBase) {
                    this.baseAssetId = id;
                    if (this.activeRowId === id) {
                        this.activeRowId = tsUtils.find(this._idWatchList, (item) => item !== this.baseAssetId);
                    }
                } else {
                    if (!isWatched) {
                        const newList = this._idWatchList.slice();
                        newList.push(id);
                        this._idWatchList = newList;
                    }
                    this.activeRowId = id;
                }
                this._parent.search = '';
            }

            /**
             * @private
             */
            _onChangeActiveWatchList() {
                if (this.active) {
                    this._activateAssets();
                } else {
                    this.activeRowId = null;
                }
            }

            /**
             * @return {null}
             * @private
             */
            _activateAssets() {
                if (!this.active) {
                    return null;
                }
                this.activeRowId = this.activeRowId || this._idWatchList[0];
                this._setNewAssetPair();
            }

            /**
             * @private
             */
            _initRowId() {
                if (this.active) {
                    if (this._assetIdPair.amount === this.baseAssetId) {
                        this.activeRowId = this._assetIdPair.price;
                    } else {
                        this.activeRowId = this._assetIdPair.amount;
                    }
                }
            }

            /**
             * @return {null}
             * @private
             */
            _onChangeActiveRow() {
                if (!this.activeRowId) {
                    return null;
                }
                this._setNewAssetPair();
                this._activeWatchListId = this._id;
            }

            /**
             * @private
             */
            _onChangeBaseAsset() {
                waves.node.assets.getExtendedAsset(this.baseAssetId)
                    .then((asset) => {
                        this._parent.title = asset.name;
                        $scope.$apply();
                    });
                this._activateAssets();
            }

            /**
             * @private
             */
            _onChangeIdWatchList() {
                utils.whenAll(this._idWatchList.map(waves.node.assets.info))
                    .then((list) => {
                        this.watchlist = list;
                        $scope.$digest();
                    });
            }

            /**
             * @private
             */
            @decorators.async()
            _setNewAssetPair() {
                if (this.active) {
                    Waves.AssetPair.get(this.baseAssetId, this.activeRowId).then((pair) => {
                        if (this.active) {
                            this._assetIdPair = {
                                amount: pair.amountAsset.id,
                                price: pair.priceAsset.id
                            };
                        }
                    });
                }
            }

            /**
             * @param {string} query
             * @return {Function}
             * @private
             */
            static _selectQuery(query) {
                return function (item) {
                    const reg = new RegExp(`(${query})`, 'i');
                    const tickerTemplate = DexWatchlist._getTickerTemplate(item.ticker, reg);
                    const itemClass = item.ticker ? 'has-ticker' : '';
                    const nameTemplate = DexWatchlist._getNameTemplate(item.name, reg);
                    return $(`<div class="search-item ${itemClass}">${tickerTemplate}${nameTemplate}</div>`);
                };
            }

            /**
             * @param {string} ticker
             * @param {RegExp} reg
             * @return {string}
             * @private
             */
            static _getTickerTemplate(ticker, reg) {
                return `<div class="ticker">${DexWatchlist._wrapQuery(ticker, reg)}</div>`;
            }

            /**
             * @param {string} name
             * @param {RegExp} reg
             * @return {string}
             * @private
             */
            static _getNameTemplate(name, reg) {
                return `<div class="name">${DexWatchlist._wrapQuery(name, reg)}</div>`;
            }

            /**
             * @param {string} text
             * @param {RegExp} reg
             * @return {string}
             * @private
             */
            static _wrapQuery(text, reg) {
                return (text || '—').replace(reg, '<span class="selected">$1</span>');
            }

        }

        return new DexWatchlist();
    };

    controller.$inject = ['Base', 'waves', 'utils', '$element', '$scope', '$state', '$location', 'decorators'];

    angular.module('app.dex')
        .component('wDexWatchlist', {
            bindings: {
                _id: '@id'
            },
            require: {
                _parent: '^wDexBlock'
            },
            templateUrl: 'modules/dex/directives/dexWatchlist/watchlist.html',
            transclude: false,
            controller
        });
})();

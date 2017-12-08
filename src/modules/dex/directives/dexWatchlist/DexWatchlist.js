(function () {
    'use strict';

    /**
     * @param Base
     * @param {Waves} waves
     * @param {app.utils} utils
     * @param {JQuery} $element
     * @return {DexWatchlist}
     */
    const controller = function (Base, waves, utils, $element) {

        class DexWatchlist extends Base {

            get active() {
                return this._id === this._activeWatchListId;
            }

            constructor() {
                super();
                /**
                 * @type {Array<IAsset>}
                 */
                this.watchlist = null;
                /**
                 * @type {string}
                 */
                this.activeRowId = null;
                /**
                 * Has focus in input in dexBlock
                 * @type {boolean}
                 */
                this.activeSearch = false;
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
                 * @type {string}
                 * @private
                 */
                this._amountAssetId = null;
                /**
                 * @type {string}
                 * @private
                 */
                this._priceAssetId = null;
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
                    _amountAssetId: 'dex.amountAssetId',
                    _priceAssetId: 'dex.priceAssetId',
                    baseAssetId: `dex.watchlist.${this._id}.baseAssetId`,
                    _activeWatchListId: 'dex.watchlist.activeWatchListId'
                });

                this.observe('activeRowId', this._onChangeActiveRow);
                this.observe('baseAssetId', this._onChangeBaseAsset);
                this.observe('_idWatchList', this._onChangeIdWatchList);
                this.observe('_activeWatchListId', this._onChangeActiveWatchList);

                this._initRowId();
                this._onChangeBaseAsset();
                this._onChangeIdWatchList();
            }

            removeWatchedAsset(event, asset) {
                event.preventDefault();
                event.stopPropagation();
                const newList = this._idWatchList.slice().filter((id) => id !== asset.id);
                this._idWatchList = newList;
                if (this.activeRowId === asset.id) {
                    this.activeRowId = this._idWatchList[0];
                }
            }

            _onChangeSearchFocus({ value }) {
                const state = !value || !this._$searchList.children().length;
                this._$searchList.toggleClass('hidden', state);
            }

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

            _onChangeActiveWatchList() {
                if (this.active) {
                    this._activateAssets();
                } else {
                    this.activeRowId = null;
                }
            }

            _activateAssets() {
                if (!this.active) {
                    return null;
                }
                this.activeRowId = this.activeRowId || this._idWatchList[0];
                if (this._amountAssetId === this.activeRowId) {
                    this._priceAssetId = this.baseAssetId;
                } else {
                    this._amountAssetId = this.baseAssetId;
                }
            }

            _initRowId() {
                if (this.active) {
                    if (this._amountAssetId === this.baseAssetId) {
                        this.activeRowId = this._priceAssetId;
                    } else {
                        this.activeRowId = this._amountAssetId;
                    }
                }
            }

            _onChangeActiveRow() {
                if (!this.activeRowId) {
                    return null;
                }
                this._activeWatchListId = this._id;
                if (this.baseAssetId === this._priceAssetId) {
                    this._amountAssetId = this.activeRowId;
                } else {
                    this._priceAssetId = this.activeRowId;
                }
            }

            _onChangeBaseAsset() {
                waves.node.assets.info(this.baseAssetId)
                    .then((asset) => {
                        this._parent.title = asset.name;
                    });
                Waves.Money.fromTokens('1', this.baseAssetId)
                    .then((money) => {
                        this.baseMoney = money;
                    });
                this._activateAssets();
            }

            _onChangeIdWatchList() {
                utils.whenAll(this._idWatchList.map(waves.node.assets.info)).then((list) => {
                    this.watchlist = list;
                });
            }

            static _selectQuery(query) {
                return function (item) {
                    const reg = new RegExp(`(${query})`, 'i');
                    const tickerTemplate = DexWatchlist._getTickerTemplate(item.ticker, reg);
                    const nameTemplate = DexWatchlist._getNameTemplate(item.name, reg);
                    return $(`<div class="search-item">${tickerTemplate}${nameTemplate}</div>`);
                };
            }

            static _getTickerTemplate(ticker, reg) {
                return `<div class="ticker">${DexWatchlist._wrapQuery(ticker, reg)}</div>`;
            }

            static _getNameTemplate(name, reg) {
                return `<div class="name">${DexWatchlist._wrapQuery(name, reg)}</div>`;
            }

            static _wrapQuery(text, reg) {
                return (text || '—').replace(reg, '<span class="selected">$1</span>');
            }

        }

        return new DexWatchlist();
    };

    controller.$inject = ['Base', 'waves', 'utils', '$element'];

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

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
                 * @type {Array<IAssetInfo>}
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

                this.observe('_idWatchList', this._onChangeIdWatchList);
                this.observe('activeRowId', this._onChangeActiveRow);
                this.observe('baseAssetId', this._onChangeBaseAsset);
                this.observe('_activeWatchListId', this._onChangeActiveWatchList);

                this.syncSettings({
                    _idWatchList: `dex.watchlist.${this._id}.list`,
                    _amountAssetId: 'dex.amountAssetId',
                    _priceAssetId: 'dex.priceAssetId',
                    baseAssetId: `dex.watchlist.${this._id}.baseAssetId`,
                    _activeWatchListId: 'dex.watchlist.activeWatchListId'
                });

                this._initRowId();
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
                                const itemClass = assetsHash[dataItem.id] ? 'remove' : 'add';
                                const $control = $(`<div class="${itemClass}"></div>`);
                                $control.on('mousedown', (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (assetsHash[dataItem.id]) {
                                        this._addToWatchList(dataItem);
                                    } else {
                                        this._removeFromWatchList(item);
                                    }
                                });
                                $element.append($control);
                                $element.on('mousedown', () => this._clickSearchItem(data[i], isChangeBase));
                            });
                            this._$searchList.empty();
                            this._$searchList.append($elements);
                            this._onChangeSearchFocus({ value: this._parent.focused });
                        });
                    }, 500);
                } else {
                    this._$searchList.empty();
                    this._onChangeSearchFocus({ value: this._parent.focused });
                }
            }

            _addToWatchList({ id }) {
                // TODO! Do. Author Tsigel at 28/11/2017 19:03
            }

            _removeFromWatchList({ id }) {
                // TODO! Do. Author Tsigel at 28/11/2017 19:03
            }

            _clickSearchItem({ id }, isChangeBase) {
                if (isChangeBase) {
                    this.baseAssetId = id;
                } else {
                    const newList = this._idWatchList.slice();
                    newList.push(id);
                    this._idWatchList = newList;
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
                this.activeRowId = this.activeRowId || this._idWatchList[0];
                if (this._amountAssetId === this.activeRowId) {
                    this._priceAssetId = this.baseAssetId;
                } else {
                    this._amountAssetId = this.baseAssetId;
                }
            }

            _initRowId() {
                if (this.active) {
                    let id = null;
                    const idList = this._idWatchList.filter(tsUtils.notContains(this.baseAssetId));

                    [this._amountAssetId, this._priceAssetId].some((assetId) => {
                        const index = idList.indexOf(assetId);
                        if (index !== -1) {
                            id = assetId;
                        }
                        return id;
                    });

                    if (!id) {
                        id = idList[0];
                    }

                    this.activeRowId = id;
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
                return (text || '').replace(reg, `<span class="selected">$1</span>`);
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

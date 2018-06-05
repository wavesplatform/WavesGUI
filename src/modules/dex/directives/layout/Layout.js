(function () {
    'use strict';

    /**
     * @param Base
     * @param $q
     * @param $element
     * @param {app.utils} utils
     * @return {Layout}
     */
    const controller = function (Base, $q, $element, utils, $rootScope) {

        class Layout extends Base {

            constructor() {
                super();
                /**
                 * @type {Deferred}
                 * @private
                 */
                this._ready = $q.defer();
                /**
                 * @type {IDexLayoutDomContainer}
                 * @private
                 */
                this._dom = null;
                this._children = {
                    watchlist: {
                        top: null
                    },
                    candlechart: {
                        top: null
                    },
                    orderbook: {
                        top: null,
                        bottom: null
                    },
                    tradehistory: {
                        top: null
                    },
                    createorder: {
                        top: null
                    }
                };
                /**
                 * @type {JQuery}
                 * @private
                 */
                this._node = null;
                /**
                 *
                 * @type {boolean}
                 * @private
                 */
                this._watchlistCollapsed = null;
                /**
                 *
                 * @type {boolean}
                 * @private
                 */
                this._orderbookCollapsed = null;

                this.isPhone = $rootScope.isPhone;
                this.isTablet = $rootScope.isTablet;
                this.isDesktop = $rootScope.isDesktop;
                this.isNotDesktop = $rootScope.isNotDesktop;

                this.syncSettings({
                    _watchlistCollapsed: 'dex.layout.watchlist.collapsed',
                    _orderbookCollapsed: 'dex.layout.orderbook.collapsed'
                });

                this.observe(['_watchlistCollapsed', '_orderbookCollapsed'], this._onChangeCollapsed);
            }

            $postLink() {
                this._node = $element.find('.dex-layout');
                this._dom = {
                    watchlist: Layout._getColumn('watchlist'),
                    candlechart: Layout._getColumn('candlechart'),
                    orderbook: Layout._getColumn('orderbook'),
                    tradehistory: Layout._getColumn('tradehistory'),
                    createorder: Layout._getColumn('createorder')
                };

                const watchlistCollapsed = this._watchlistCollapsed;
                const orderbookCollapsed = this._orderbookCollapsed;
                const base = 'dex-layout';

                this._node.get(0).className = 'dex-layout';
                this._node.toggleClass(`${base}__watchlist-collapsed`, watchlistCollapsed);
                this._node.toggleClass(`${base}__orderbook-collapsed`, orderbookCollapsed);
                this._dom.watchlist.slider.toggleClass(`${base}__sidebar-toggle-open`, !watchlistCollapsed);
                this._dom.orderbook.slider.toggleClass(`${base}__sidebar-toggle-open`, !orderbookCollapsed);

                this._ready.resolve();
            }

            /**
             * @param {JQuery} $element
             * @param {DexBlock} item
             */
            registerItem($element, item) {
                const { column, block } = item;

                if (!column || !block) {
                    throw new Error('Wrong item address!');
                }

                this._ready.promise.then(() => {
                    if (!this._children[column][block]) {
                        this._children[column][block] = item;
                        this._dom[column][block].append($element);
                    }
                });
            }

            collapseBlock(column, block, collapsed) {
                this._node.toggleClass(`dex-layout__block-${column}-${block}-collapsed`, collapsed);
            }

            toggleColumn(column) {
                switch (column) {
                    case 'watchlist':
                        this._watchlistCollapsed = !this._watchlistCollapsed;
                        break;
                    case 'orderbook':
                        this._orderbookCollapsed = !this._orderbookCollapsed;
                        break;
                    default:
                        throw new Error('Wrong column name!');
                }
            }

            _onChangeCollapsed() {
                const watchlist = this._watchlistCollapsed;
                const orderbook = this._orderbookCollapsed;
                const base = 'dex-layout';

                utils.animateByClass(this._dom.candlechart.column, 'ghost', true, 'opacity')
                    .then(() => {
                        this._dom.watchlist.slider.toggleClass(`${base}__sidebar-toggle-open`, !watchlist);
                        this._dom.orderbook.slider.toggleClass(`${base}__sidebar-toggle-open`, !orderbook);

                        return utils.whenAll([
                            utils.animateByClass(this._node, `${base}__watchlist-collapsed`, watchlist, 'transform'),
                            utils.animateByClass(this._node, `${base}__orderbook-collapsed`, orderbook, 'transform')
                        ]);
                    })
                    .then(() => {
                        return utils.wait(0);
                    })
                    .then(() => {
                        utils.animateByClass(this._dom.candlechart.column, 'ghost', false, 'opacity');
                    });
            }

            /**
             * @param {string} type
             * @return {IDexLayoutDomContainerItem}
             * @private
             */
            static _getColumn(type) {
                const column = $element.find(`[data-column="${type}"]`);
                const top = column.find('[data-block="top"]');
                const bottom = column.find('[data-block="bottom"]');
                const slider = column.find('[data-slider]');

                return { column, top, bottom, slider };
            }

        }

        return new Layout();
    };

    controller.$inject = ['Base', '$q', '$element', 'utils', '$rootScope'];

    angular.module('app.dex')
        .component('wLayout', {
            scope: false,
            bindings: {},
            templateUrl: 'modules/dex/directives/layout/layout.html',
            transclude: true,
            controller
        });
})();

/**
 * @typedef {object} IDexLayoutDomContainerItem
 * @property {JQuery} column
 * @property {JQuery} top
 * @property {JQuery} bottom
 * @property {JQuery} slider
 */

/**
 * @typedef {object} IDexLayoutDomContainer
 * @property {IDexLayoutDomContainerItem} left
 * @property {IDexLayoutDomContainerItem} center
 * @property {IDexLayoutDomContainerItem} right
 */

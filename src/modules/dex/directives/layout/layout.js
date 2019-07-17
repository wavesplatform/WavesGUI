(function () {
    'use strict';

    /**
     * @param {typeof Base} Base
     * @param {ng.IQService} $q
     * @param {ng.IAugmentedJQuery} $element
     * @param {app.utils} utils
     * @param {ng.IRootScopeService} $rootScope
     * @param {VisibleService} visibleService
     * @param {app.utils.decorators} decorators
     * @return {Layout}
     */
    const controller = function (Base, $q, $element, utils, $rootScope, visibleService, decorators) {

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
                    watchlist: null,
                    candlechart: null,
                    orderbook: null,
                    tradehistory: null,
                    createorder: null,
                    tradevolume: null
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
                this.isNotPhone = $rootScope.isNotPhone;
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
                    createorder: Layout._getColumn('createorder'),
                    tradevolume: Layout._getColumn('tradevolume')
                };

                const watchlistCollapsed = this._watchlistCollapsed;
                const orderbookCollapsed = this._orderbookCollapsed;
                const base = 'dex-layout';

                this._node.get(0).className = 'dex-layout';
                this._node.toggleClass(`${base}_watchlist-collapsed`, watchlistCollapsed);
                this._node.toggleClass(`${base}_orderbook-collapsed`, orderbookCollapsed);
                this._dom.watchlist.$slider.toggleClass(`${base}__sidebar-toggle-open`, !watchlistCollapsed);
                this._dom.orderbook.$slider.toggleClass(`${base}__sidebar-toggle-open`, !orderbookCollapsed);

                this._ready.resolve();
            }

            /**
             * @param {JQuery} $element
             * @param {DexBlock} item
             */
            registerItem($element, item) {
                const { block } = item;

                if (!block) {
                    throw new Error('Wrong item address!');
                }

                this._ready.promise.then(() => {
                    if (!this._children[block]) {
                        this._children[block] = item;
                        this._dom[block].$container.append($element);
                    } else {
                        throw new Error('Duplicate child block!');
                    }
                });
            }

            /**
             * @param $event
             */
            closeCreateOrder($event) {
                angular.element($event.delegateTarget).parent().removeClass('expanded');
            }

            collapseBlock(block, collapsed) {
                this._node.toggleClass(`dex-layout_${block}-collapsed`, collapsed);
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

            @decorators.async(300)
            updateVisible() {
                visibleService.updateSort();
            }

            _onChangeCollapsed() {
                const watchlist = this._watchlistCollapsed;
                const orderbook = this._orderbookCollapsed;
                const base = 'dex-layout';

                utils.animateByClass(this._dom.candlechart.$wrapper, 'ghost', true, 'opacity')
                    .then(() => {
                        this._dom.candlechart.$wrapper.hide();
                        this._dom.watchlist.$slider.toggleClass(`${base}__sidebar-toggle-open`, !watchlist);
                        this._dom.orderbook.$slider.toggleClass(`${base}__sidebar-toggle-open`, !orderbook);

                        const endCollapseAnimations = utils.whenAll([
                            utils.animateByClass(this._node, `${base}_watchlist-collapsed`, watchlist, 'transform'),
                            utils.animateByClass(this._node, `${base}_orderbook-collapsed`, orderbook, 'transform')
                        ]);

                        const notWorking = new Promise((resolve, reject) => {
                            setTimeout(reject, 3000);
                        });

                        return Promise.race([endCollapseAnimations, notWorking])
                            .catch(() => {
                                /* eslint no-console: "off" */
                                console.warn('Not working css animation end event!');
                            });
                    })
                    .then(() => {
                        this._dom.candlechart.$wrapper.show();
                        return utils.wait(0);
                    })
                    .then(() => {
                        utils.animateByClass(this._dom.candlechart.$wrapper, 'ghost', false, 'opacity');
                    });
            }

            /**
             * @param {string} type
             * @return {IDexLayoutDomContainerItem}
             * @private
             */
            static _getColumn(type) {
                const $container = $element.find(`[data-block="${type}"]`);
                const $wrapper = $container.parent();
                const $slider = $wrapper.find('[data-slider]');

                return { $wrapper, $container, $slider };
            }

        }

        return new Layout();
    };

    controller.$inject = ['Base', '$q', '$element', 'utils', '$rootScope', 'visibleService', 'decorators'];

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
 * @property {JQuery} $wrapper
 * @property {JQuery} $container
 * @property {JQuery} $slider
 * @property {DexBlock} child
 */

/**
 * @typedef {object} IDexLayoutDomContainer
 * @property {IDexLayoutDomContainerItem} left
 * @property {IDexLayoutDomContainerItem} center
 * @property {IDexLayoutDomContainerItem} right
 */

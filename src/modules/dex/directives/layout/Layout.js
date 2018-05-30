(function () {
    'use strict';

    /**
     * @param Base
     * @param $q
     * @param $element
     * @param {app.utils} utils
     * @return {Layout}
     */
    const controller = function (Base, $q, $element, utils) {

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
                /**
                 * @type {
                 *  {
                 *      left: {
                 *          top: LayoutItem,
                 *          bottom: LayoutItem
                 *      },
                 *      center: {
                 *          top: LayoutItem,
                 *          bottom: LayoutItem
                 *      },
                 *      right: {
                 *          top: LayoutItem,
                 *          bottom: LayoutItem
                 *      }
                 *  }
                 * }
                 * @private
                 */
                this._children = {
                    topleft: {
                        top: null
                    },
                    topcenter: {
                        top: null
                    },
                    topright: {
                        top: null,
                        bottom: null
                    },
                    bottomleft: {
                        top: null
                    },
                    bottomright: {
                        top: null
                    }
                };
                /**
                 * @type {JQuery}
                 * @private
                 */
                this._node = null;
                /**
                 * @type {number}
                 * @private
                 */
                this._topLeftHeight = null;
                /**
                 *
                 * @type {number}
                 * @private
                 */
                this._topRightHeight = null;
                /**
                 *
                 * @type {boolean}
                 * @private
                 */
                this._topLeftCollapsed = null;
                /**
                 *
                 * @type {boolean}
                 * @private
                 */
                this._topRightCollapsed = null;

                this.syncSettings({
                    // _topLeftHeight: 'dex.layout.topleft.split',
                    // _topRightHeight: 'dex.layout.topright.split',
                    // _topCenterHeight: 'dex.layout.topcenter.split',
                    _topLeftCollapsed: 'dex.layout.topleft.collapsed',
                    _topRightCollapsed: 'dex.layout.topright.collapsed'
                });

                this.observe(['_topLeftCollapsed', '_topRightCollapsed'], this._onChangeCollapsed);
                // this.observe(['_topLeftHeight', '_topRightHeight'], this._onChangeHeight);
            }

            $postLink() {
                this._node = $element.find('.dex-layout');
                this._dom = {
                    topleft: Layout._getColumn('topleft'),
                    topcenter: Layout._getColumn('topcenter'),
                    topright: Layout._getColumn('topright'),
                    bottomleft: Layout._getColumn('bottomleft'),
                    bottomright: Layout._getColumn('bottomright')
                };

                const topleft = this._topLeftCollapsed;
                const topright = this._topRightCollapsed;
                const base = 'dex-layout';

                this._node.get(0).className = 'dex-layout';
                this._node.toggleClass(`${base}__topleft-collapsed`, topleft);
                this._node.toggleClass(`${base}__topright-collapsed`, topright);
                this._dom.topleft.slider.toggleClass(`${base}__sidebar-toggle-open`, !topleft);
                this._dom.topright.slider.toggleClass(`${base}__sidebar-toggle-open`, !topright);

                this._onChangeHeight();

                this._ready.resolve();

                $(window).resize(() => {
                    if (
                        window.innerWidth >= 481 &&
                        window.innerWidth <= 768
                    ) {
                        $('.dex-layout__row-top').prepend(this._dom.topright.column);
                    }
                });
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
                    case 'topleft':
                        this._topLeftCollapsed = !this._topLeftCollapsed;
                        break;
                    case 'topright':
                        this._topRightCollapsed = !this._topRightCollapsed;
                        break;
                    default:
                        throw new Error('Wrong column name!');
                }
            }

            _onChangeHeight() {
                // const left = this._leftHeight;
                // const center = this._centerHeight;
                // const topright = this._topRightHeight;
                // this._dom.left.top.css('height', `${left}%`);
                // this._dom.left.bottom.css('height', `${100 - left}%`);
                // this._dom.center.top.css('height', `${center}%`);
                // this._dom.center.bottom.css('height', `${100 - center}%`);
                // this._dom.topright.top.css('height', `${topright}%`);
                // this._dom.topright.bottom.css('height', `${100 - topright}%`);
            }

            _onChangeCollapsed() {
                const topleft = this._topLeftCollapsed;
                const topright = this._topRightCollapsed;
                const base = 'dex-layout';

                utils.animateByClass(this._dom.topcenter.column, 'ghost', true, 'opacity')
                    .then(() => {
                        // this._dom.topcenter.column.css('display', 'none'); // TODO check
                        this._dom.topleft.slider.toggleClass(`${base}__sidebar-toggle-open`, !topleft);
                        this._dom.topright.slider.toggleClass(`${base}__sidebar-toggle-open`, !topright);

                        return utils.whenAll([
                            utils.animateByClass(this._node, `${base}__topleft-collapsed`, topleft, 'flex-basis'),
                            utils.animateByClass(this._node, `${base}__topright-collapsed`, topright, 'flex-basis')
                        ]);
                    })
                    .then(() => {
                        // this._dom.topcenter.column.css('display', 'flex');
                        return utils.wait(0);
                    })
                    .then(() => {
                        utils.animateByClass(this._dom.topcenter.column, 'ghost', false, 'opacity');
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

    controller.$inject = ['Base', '$q', '$element', 'utils'];

    angular.module('app.dex')
        .component('wLayout', {
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

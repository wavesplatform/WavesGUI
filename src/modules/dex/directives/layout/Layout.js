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
                    left: {
                        top: null,
                        bottom: null
                    },
                    center: {
                        top: null,
                        bottom: null
                    },
                    right: {
                        top: null,
                        bottom: null
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
                this._leftHeight = null;
                /**
                 *
                 * @type {number}
                 * @private
                 */
                this._rightHeight = null;
                /**
                 *
                 * @type {boolean}
                 * @private
                 */
                this._leftCollapsed = null;
                /**
                 *
                 * @type {boolean}
                 * @private
                 */
                this._rightCollapsed = null;

                this.syncSettings({
                    _leftHeight: 'dex.layout.left.split',
                    _rightHeight: 'dex.layout.right.split',
                    _centerHeight: 'dex.layout.center.split',
                    _leftCollapsed: 'dex.layout.left.collapsed',
                    _rightCollapsed: 'dex.layout.right.collapsed'
                });

                this.observe(['_leftCollapsed', '_rightCollapsed'], this._onChangeCollapsed);
                this.observe(['_leftHeight', '_rightHeight'], this._onChangeHeight);
            }

            $postLink() {
                this._node = $element.find('.dex-layout');
                this._dom = {
                    left: Layout._getColumn('left'),
                    center: Layout._getColumn('center'),
                    right: Layout._getColumn('right')
                };

                const left = this._leftCollapsed;
                const right = this._rightCollapsed;
                const base = 'dex-layout';

                this._node.get(0).className = 'dex-layout';
                this._node.toggleClass(`${base}__left-collapsed`, left);
                this._node.toggleClass(`${base}__right-collapsed`, right);
                this._dom.left.slider.toggleClass(`${base}__sidebar-toggle-open`, !left);
                this._dom.right.slider.toggleClass(`${base}__sidebar-toggle-open`, !right);

                this._onChangeHeight();

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
                    case 'left':
                        this._leftCollapsed = !this._leftCollapsed;
                        break;
                    case 'right':
                        this._rightCollapsed = !this._rightCollapsed;
                        break;
                    default:
                        throw new Error('Wrong column name!');
                }
            }

            _onChangeHeight() {
                const left = this._leftHeight;
                const center = this._centerHeight;
                const right = this._rightHeight;

                this._dom.left.top.css('height', `${left}%`);
                this._dom.left.bottom.css('height', `${100 - left}%`);

                this._dom.center.top.css('height', `${center}%`);
                this._dom.center.bottom.css('height', `${100 - center}%`);

                this._dom.right.top.css('height', `${right}%`);
                this._dom.right.bottom.css('height', `${100 - right}%`);
            }

            _onChangeCollapsed() {
                const left = this._leftCollapsed;
                const right = this._rightCollapsed;
                const base = 'dex-layout';

                utils.animateByClass(this._dom.center.column, 'ghost', true, 'opacity')
                    .then(() => {
                        this._dom.center.column.css('display', 'none'); // TODO check
                        this._dom.left.slider.toggleClass(`${base}__sidebar-toggle-open`, !left);
                        this._dom.right.slider.toggleClass(`${base}__sidebar-toggle-open`, !right);

                        return utils.whenAll([
                            utils.animateByClass(this._node, `${base}__left-collapsed`, left, 'transform'),
                            utils.animateByClass(this._node, `${base}__right-collapsed`, right, 'transform')
                        ]);
                    })
                    .then(() => {
                        this._dom.center.column.css('display', 'block');
                        return utils.wait(0);
                    })
                    .then(() => {
                        utils.animateByClass(this._dom.center.column, 'ghost', false, 'opacity');
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

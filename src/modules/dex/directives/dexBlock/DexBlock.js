(function () {
    'use strict';

    /**
     * @param Base
     * @param {JQuery} $element
     * @param {app.utils} utils
     * @param {app.i18n} i18n
     * @return {DexBlock}
     */
    const controller = function (Base, $element, utils, i18n) {

        class DexBlock extends Base {

            constructor() {
                super();
                /**
                 * For find assets in watchlist
                 * @type {string}
                 */
                this.search = '';
                /**
                 * Literal for i18n
                 * @type {string}
                 */
                this.titleLiteral = null;
                /**
                 * @type {boolean}
                 */
                this.collapsed = false;
                /**
                 * For find assets in watchlist
                 * @type {boolean}
                 */
                this.focused = false;
                /**
                 * Mode for choose base asset id for dex block
                 * @type {boolean}
                 */
                this.changeBaseAssetMode = false;
                /**
                 * @type {string}
                 */
                this.block = null;
                /**
                 * @type {string}
                 */
                this.column = null;
                /**
                 * @type {Layout}
                 * @private
                 */
                this._parent = null;

                i18n.translateField(this, 'titleLiteral', 'title', 'app.dex');
                this.observe('changeBaseAssetMode', this._onChangeAssetMode);
            }

            $postLink() {

                this.syncSettings({
                    collapsed: `dex.layout.${this.column}.collapsedBlock`
                });

                this._parent.collapseBlock(this.column, this.block, this.collapsed);
                this._parent.registerItem($element, this);
            }

            toggleCollapse() {
                const collapsed = this.collapsed;
                if (collapsed) {
                    this.collapsed = !collapsed;
                    utils.wait(100)
                        .then(() => {
                            this._parent.collapseBlock(this.column, this.block, this.collapsed);
                        });
                } else {
                    this._parent.collapseBlock(this.column, this.block, !this.collapsed);
                    utils.wait(300)
                        .then(() => {
                            this.collapsed = !collapsed;
                        });
                }
            }

            onClickTitle() {
                if (this.hasSearch) {
                    this.changeBaseAssetMode = true;
                    utils.wait().then(() => {
                        $element.find('input.change-base-asset-input').focus();
                    });
                }
            }

            /**
             * @param {boolean} value
             * @private
             */
            _onChangeAssetMode({ value }) {
                if (value) {
                    this.focused = true;
                    this.search = this.title;
                    $element.find('.change-base-asset-input')
                        .focus();
                } else {
                    this.focused = false;
                    this.search = '';
                }
            }

        }

        return new DexBlock();
    };

    controller.$inject = ['Base', '$element', 'utils', 'i18n'];

    angular.module('app.dex')
        .component('wDexBlock', {
            require: {
                _parent: '^wLayout'
            },
            bindings: {
                titleLiteral: '@titleName',
                column: '@',
                block: '@',
                hasSearch: '@',
                canCollapse: '@'
            },
            templateUrl: 'modules/dex/directives/dexBlock/dexBlock.html',
            transclude: true,
            controller
        });
})();

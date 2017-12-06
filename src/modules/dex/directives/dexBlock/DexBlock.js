(function () {
    'use strict';

    /**
     * @param Base
     * @param {JQuery} $element
     * @return {DexBlock}
     */
    const controller = function (Base, $element) {

        class DexBlock extends Base {

            constructor() {
                super();
                /**
                 * For find assets in watchlist
                 * @type {string}
                 */
                this.search = '';
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

                this.observe('changeBaseAssetMode', this._onChangeAssetMode);
            }

            $postLink() {
                this._parent.registerItem($element, this);
            }

            toggleCollapse() {
                this.collapsed = !this.collapsed;
            }

            onClickTitle() {
                if (this.hasSearch) {
                    this.changeBaseAssetMode = true;
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
                    $element.find('.change-base-asset-input').focus();
                } else {
                    this.focused = false;
                    this.search = '';
                }
            }

        }

        return new DexBlock();
    };

    controller.$inject = ['Base', '$element'];

    angular.module('app.dex').component('wDexBlock', {
        require: {
            _parent: '^wLayout'
        },
        bindings: {
            title: '@titleName',
            column: '@',
            block: '@',
            hasSearch: '@',
            canCollapse: '@',
            collapsed: '='
        },
        templateUrl: 'modules/dex/directives/dexBlock/dexBlock.html',
        transclude: true,
        controller
    });
})();

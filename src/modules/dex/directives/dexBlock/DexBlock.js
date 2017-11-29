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

                this.observe('changeBaseAssetMode', this._onChangeAssetMode);
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
        bindings: {
            title: '@titleName',
            hasSearch: '@',
            canCollapse: '@',
            collapsed: '='
        },
        templateUrl: 'modules/dex/directives/dexBlock/dexBlock.html',
        transclude: true,
        controller
    });
})();

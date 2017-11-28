(function () {
    'use strict';

    /**
     * @param Base
     * @param {JQuery} $element
     * @param {app.utils} utils
     * @param {User} user
     * @param {*} $attrs
     * @return {DexBlock}
     */
    const controller = function (Base, $element, utils, user, $attrs) {

        class DexBlock extends Base {

            constructor() {
                super();
                /**
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
            }

            toggleCollapse() {
                this.collapsed = !this.collapsed;
            }
        }

        return new DexBlock();
    };

    controller.$inject = ['Base', '$element', 'utils', 'user', '$attrs'];

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

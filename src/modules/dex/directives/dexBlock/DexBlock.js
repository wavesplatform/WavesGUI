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
                 * @type {string}
                 */
                this.savePath = null;
                this._collapsed = user.address && $attrs.savePath ?
                    user.getSettingByUser(user, $attrs.savePath) : false;

                this.observe('_collapsed', this._onChangeCollapse);
                this._onChangeCollapse();
            }

            $postLink() {
                if (this.savePath) {
                    this.syncSettings({ _collapsed: `${this.savePath}.collapsed` });
                }
            }

            toggleCollapse() {
                this._collapsed = !this._collapsed;
            }

            _onChangeCollapse() {
                utils.animateByClass($element, 'collapsed', this._collapsed);
            }

        }

        return new DexBlock();
    };

    controller.$inject = ['Base', '$element', 'utils', 'user', '$attrs'];

    angular.module('app.dex').component('wDexBlock', {
        bindings: {
            title: '@',
            savePath: '@',
            hasSearch: '@',
            canCollapse: '@'
        },
        templateUrl: 'modules/dex/directives/dexBlock/dexBlock.html',
        transclude: true,
        controller
    });
})();

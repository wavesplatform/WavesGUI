(function () {
    'use strict';

    const controller = function (Base) {

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
            }

            $postLink() {

            }

            toggleCollapse() {

            }

        }

        return new DexBlock();
    };

    controller.$inject = ['Base'];

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

(function () {
    'use strict';

    /**
     * @param $element
     * @param {User} user
     * @return {Header}
     */
    const controller = function ($element, user) {

        class Header {

            constructor() {
                /**
                 * @type {string}
                 */
                this.address = user.address;
            }

            $postLink() {

            }

            $onDestroy() {

            }

        }

        return new Header();
    };

    controller.$inject = ['$element', 'user'];

    angular.module('app.ui').component('wHeader', {
        transclude: true,
        bindings: {},
        controller: controller,
        templateUrl: 'modules/ui/directives/header/header.html'
    });
})();

(function () {
    'use strict';

    const controller = function () {

        class Button {

            constructor() {
                /**
                 * @type {string}
                 */
                this.type = null;
                /**
                 * @type {string}
                 */
                this.mode = null;
            }

            $postLink() {

            }

        }

        return new Button();
    };

    controller.$inject = [];

    angular.module('app.ui')
        .component('wButton', {
            bindings: {
                type: '@',
                mode: '@'
            },
            controller
        });
})();

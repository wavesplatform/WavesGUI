(function () {
    'use strict';

    const controller = function (Base) {

        class Notification extends Base {

            constructor() {
                super();
            }

            $postLink() {

            }

        }

        return new Notification();
    };

    controller.$inject = ['Base'];

    angular.module('app.ui').component('w', {
        bindings: {},
        templateUrl: '.html',
        transclude: false,
        controller
    });
})();

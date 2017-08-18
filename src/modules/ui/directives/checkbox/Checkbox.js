(function () {
    'use strict';

    class Checkbox {

        constructor() {
            /**
             * @type {string}
             */
            this.class = null;
            /**
             * @type {boolean}
             */
            this.value = null;
        }

        $postlink() {

        }

    }

    Checkbox.$inject = [];

    angular.module('app.ui').component('wCheckbox', {
        bindings: {
            class: '@',
            value: '='
        },
        controller: Checkbox,
        templateUrl: ''
    });
})();

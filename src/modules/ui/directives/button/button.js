(function () {
    'use strict';

    class Button {

        isButton() {
            return this.type !== 'transparent';
        }

        isTransparent() {
            return this.type === 'transparent';
        }

    }

    angular.module('app.ui').component('wButton', {
        transclude: true,
        bindings: {
            type: '@',
            size: '@',
            onClick: '&'
        },
        controller: Button,
        templateUrl: 'modules/ui/directives/button/button.html'
    });
})();

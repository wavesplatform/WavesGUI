(function () {
    'use strict';

    angular.module('app.ui').component('wPermitMessage', {
        require: {
            parent: '^wPermit'
        },
        bindings: {
            literal: '@'
        },
        template: '<div class="w-permit-message" w-i18n="{{::$ctrl.literal}}"></div>'
    });
})();

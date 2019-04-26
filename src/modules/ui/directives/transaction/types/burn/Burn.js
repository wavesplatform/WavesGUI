(function () {
    'use strict';

    angular.module('app.ui').component('wBurn', {
        bindings: {
            props: '<'
        },
        templateUrl: 'modules/ui/directives/transaction/types/burn/burn.html'
    });
})();

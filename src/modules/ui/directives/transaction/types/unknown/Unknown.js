(function () {
    'use strict';

    angular.module('app.ui').component('wUnknown', {
        bindings: {
            props: '<'
        },
        templateUrl: 'modules/ui/directives/transaction/types/unknown/unknown.html'
    });
})();

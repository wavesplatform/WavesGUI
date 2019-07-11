(function () {
    'use strict';

    angular.module('app.ui').component('wCancelLeasing', {
        bindings: {
            props: '<'
        },
        templateUrl: 'modules/ui/directives/transaction/types/cancel-leasing/cancel-leasing.html'
    });
})();

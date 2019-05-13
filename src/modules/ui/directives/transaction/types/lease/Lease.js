(function () {
    'use strict';

    angular.module('app.ui').component('wLease', {
        bindings: {
            props: '<'
        },
        templateUrl: 'modules/ui/directives/transaction/types/lease/lease.html'
    });
})();

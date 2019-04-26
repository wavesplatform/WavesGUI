(function () {
    'use strict';

    angular.module('app.ui').component('wTransfer', {
        bindings: {
            props: '<'
        },
        templateUrl: 'modules/ui/directives/transaction/types/transfer/transfer.html'
    });
})();

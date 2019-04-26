(function () {
    'use strict';

    angular.module('app.ui').component('wTransactionHeader', {
        bindings: {
            typeName: '<',
            assetName: '<'
        },
        templateUrl: 'modules/ui/directives/transaction/transaction-header.html'
    });
})();

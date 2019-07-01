(function () {
    'use strict';

    angular.module('app.ui').component('wDataHeader', {
        bindings: {
            signable: '<',
            voteObject: '<'
        },
        templateUrl: 'modules/ui/directives/transactionInfo/types/data/data-header.html'
    });
})();

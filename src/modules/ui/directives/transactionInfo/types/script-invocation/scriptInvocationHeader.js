(function () {
    'use strict';

    angular.module('app.ui').component('wScriptInvocationHeader', {
        bindings: {
            signable: '<'
        },
        templateUrl: 'modules/ui/directives/transactionInfo/types/script-invocation/script-invocation-header.html'
    });
})();

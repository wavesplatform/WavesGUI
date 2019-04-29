(function () {
    'use strict';

    angular.module('app.ui').component('wData', {
        bindings: {
            props: '<'
        },
        templateUrl: 'modules/ui/directives/transaction/types/data/data.html'
    });
})();

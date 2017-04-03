(function () {
    'use strict';

    function PairsListController() {}

    angular
        .module('app.dex')
        .component('wavesDexPairsList', {
            controller: PairsListController,
            bindings: {
                type: '@',
                name: '@',
                placeholder: '@',
                pairs: '<',
                action: '&'
            },
            templateUrl: 'dex/pairs.list.component'
        });
})();

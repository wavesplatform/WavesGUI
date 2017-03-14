(function () {
    'use strict';

    function PairsListController($attrs) {
        this.type = $attrs.type;
        this.name = $attrs.name;
        this.placeholder = $attrs.placeholder;
        this.pairs = $attrs.pairs;
    }

    angular
        .module('app.dex')
        .component('wavesDexPairsList', {
            controller: PairsListController,
            bindings: {
                type: '@',
                name: '@',
                placeholder: '@',
                pairs: '<'
            },
            templateUrl: 'dex/pairs.list.component'
        });
})();

(function () {
    'use strict';

    function PairsListController($attrs) {
        this.type = $attrs.type;
        this.title = $attrs.title;
        this.placeholder = $attrs.placeholder;
        this.pairs = $attrs.pairs;
    }

    angular
        .module('app.dex')
        .component('wavesDexPairsList', {
            controller: PairsListController,
            bindings: {
                type: '@',
                title: '@',
                placeholder: '@',
                pairs: '<'
            },
            templateUrl: 'dex/pairs.list.component'
        });
})();

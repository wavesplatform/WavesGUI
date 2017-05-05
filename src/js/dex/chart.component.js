(function () {
    'use strict';

    function ChartController($element, datafeedApiService) {
        var ctrl = this,
            canvas = $element.children('canvas');

        datafeedApiService.getSymbols().then(function (response) {
            console.log(response);
        });
    }

    ChartController.$inject = ['$element', 'datafeedApiService'];

    angular
        .module('app.dex')
        .component('wavesDexChart', {
            controller: ChartController,
            bindings: {
                pair: '<'
            },
            templateUrl: 'dex/chart.component'
        });
})();

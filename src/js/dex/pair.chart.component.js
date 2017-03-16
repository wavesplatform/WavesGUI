(function () {
    'use strict';

    function PairChartController() {}

    angular
        .module('app.dex')
        .component('wavesDexPairChart', {
            controller: PairChartController,
            templateUrl: 'dex/pair.chart.component'
        });
})();

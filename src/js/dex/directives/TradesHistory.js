(function () {
    'use strict';

    function TradesHistory() {}

    angular
        .module('app.dex')
        .component('wavesDexHistory', {
            controller: TradesHistory,
            bindings: {
                pair: '<',
                trades: '<'
            },
            templateUrl: 'dex/history.component'
        });
})();

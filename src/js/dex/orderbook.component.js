(function () {
    'use strict';

    function OrderbookController() {}

    angular
        .module('app.dex')
        .component('wavesDexOrderbook', {
            controller: OrderbookController
        });
})();

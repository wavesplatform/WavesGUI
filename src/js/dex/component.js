(function () {
    'use strict';

    function DexController() {
        var ctrl = this;

        ctrl.priceAsset = null;
        ctrl.amountAsset = null;
    }

    angular
        .module('app.dex')
        .component('wavesDex', {
            controller: DexController,
            templateUrl: 'dex/component'
        });
})();

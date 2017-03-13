(function () {
    'use strict';

    function DexController() {
        var ctrl = this;

        ctrl.priceAsset = null;
        ctrl.amountAsset = null;

        ctrl.assetsOne = [
            Currency.WAV,
            Currency.BTC
        ];

        ctrl.assetsTwo = [
            Currency.WAV,
            Currency.BTC,
            Currency.EUR,
            Currency.USD
        ];
    }

    angular
        .module('app.dex')
        .component('wavesDex', {
            controller: DexController,
            templateUrl: 'dex/component'
        });
})();

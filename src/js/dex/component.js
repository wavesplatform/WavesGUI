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

        ctrl.favoritePairs = [{
            priceAsset: {abbr: 'WAV'},
            amountAsset: {abbr: 'USD'}
        }, {
            priceAsset: {abbr: 'BTC'},
            amountAsset: {abbr: 'USD'}
        }, {
            priceAsset: {abbr: 'WAV'},
            amountAsset: {abbr: 'USD'}
        }, {
            priceAsset: {abbr: 'BTC'},
            amountAsset: {abbr: 'ETH'}
        }];

        ctrl.tradedPairs = [{
            priceAsset: {abbr: 'WAV'},
            amountAsset: {abbr: 'USD'}
        }, {
            priceAsset: {abbr: 'BTC'},
            amountAsset: {abbr: 'USD'}
        }];
    }

    angular
        .module('app.dex')
        .component('wavesDex', {
            controller: DexController,
            templateUrl: 'dex/component'
        });
})();

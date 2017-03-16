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

        // FIXME : those are placeholders for Currency until it starts supporting `shortName` property.
        ctrl.favoritePairs = [{
            priceAsset: {shortName: 'WAV'},
            amountAsset: {shortName: 'USD'}
        }, {
            priceAsset: {shortName: 'BTC'},
            amountAsset: {shortName: 'USD'}
        }, {
            priceAsset: {shortName: 'WAV'},
            amountAsset: {shortName: 'USD'}
        }, {
            priceAsset: {shortName: 'BTC'},
            amountAsset: {shortName: 'ETH'}
        }];

        // FIXME : those are placeholders for Currency until it starts supporting `shortName` property.
        ctrl.tradedPairs = [{
            priceAsset: {shortName: 'WAV'},
            amountAsset: {shortName: 'USD'}
        }, {
            priceAsset: {shortName: 'BTC'},
            amountAsset: {shortName: 'USD'}
        }];

        ctrl.addFavorite = function () {};
        ctrl.showMoreTraded = function () {};
    }

    angular
        .module('app.dex')
        .component('wavesDex', {
            controller: DexController,
            templateUrl: 'dex/component'
        });
})();

(function () {
    'use strict';

    // FIXME : this data is fake.
    function getOrdersFromBackend(sign) {
        var orders = [],
            price,
            amount;
        for (var i = 0; i < 20; i++) {
            price = ((1 - i * 0.001 * sign) + Math.random() * 0.0002).toPrecision(8) * 100000000;
            amount = (Math.ceil(Math.random() * 40) + 3 + Math.random() * 2).toPrecision(8);
            orders.push({
                price: price,
                amount: amount
            });
        }
        return orders;
    }

    function normalizeOrder(order) {
        return {
            price: order.price / Math.pow(10, 8),
            amount: order.amount
        };
    }

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

        ctrl.buyOrders = getOrdersFromBackend(1).map(normalizeOrder);
        ctrl.sellOrders = getOrdersFromBackend(-1).map(normalizeOrder);
    }

    angular
        .module('app.dex')
        .component('wavesDex', {
            controller: DexController,
            templateUrl: 'dex/component'
        });
})();

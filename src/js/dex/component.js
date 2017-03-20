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

    function normalizeBalance(n) {
        return n / Math.pow(10, 8);
    }

    function normalizeOrder(order) {
        return {
            price: normalizeBalance(order.price),
            amount: order.amount
        };
    }

    function DexController(applicationContext, apiService) {
        var ctrl = this;

        getUserBalances();

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
        ctrl.userOrders = [];

        function getUserBalances(callback) {
            var balances = [];
            Promise.resolve()
                .then(apiService.assets.balance.bind(apiService.assets, applicationContext.account.address))
                .then(function (response) {
                    balances = response.balances.map(function (item) {
                        return {
                            assetId: item.assetId,
                            balance: item.balance,
                            decimals: item.issueTransaction.decimals,
                            name: item.issueTransaction.name
                        };
                    });
                })
                .then(apiService.address.balance.bind(apiService.assets, applicationContext.account.address))
                .then(function (response) {
                    balances.unshift({
                        assetId: '', // TODO
                        balance: normalizeBalance(response.balance),
                        decimals: 8,
                        name: 'Waves'
                    });
                });
        }
    }

    DexController.$inject = ['applicationContext', 'apiService'];

    angular
        .module('app.dex')
        .component('wavesDex', {
            controller: DexController,
            templateUrl: 'dex/component'
        });
})();

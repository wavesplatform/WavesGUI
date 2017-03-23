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

    function DexController($scope, applicationContext, assetStoreFactory,
                           dexOrderService, dexOrderbookService) {
        var ctrl = this;

        var assetStore = assetStoreFactory.createStore(applicationContext.account.address),
            initialAssetOne = Currency.WAV,
            initialAssetTwo = Currency.BTC;

        dexOrderbookService
            .switchToPair(initialAssetOne, initialAssetTwo)
            .then(function (orderbook) {
                // ctrl.pair = {
                //     priceAsset: orderbook.priceAsset,
                //     amountAsset: orderbook.amountAsset
                // };
                //
                // // TODO : normalize them all inside the service.
                // ctrl.buyOrders = orderbook.bids;
                // ctrl.sellOrders = orderbook.asks;
                // ctrl.userOrders = dexOrderService.getOrders(ctrl.pair);
            });

        assetStore
            .getAll()
            .then(function (assetsList) {
                $scope.$apply(function () {
                    ctrl.assetsList = assetsList;
                    ctrl.pair = {
                        priceAsset: assetsList[0].currency,
                        amountAsset: assetsList[1].currency
                    };
                });
            });

        // favoritePairsService
        //     .getAll()
        //     .then(function () {
        //         // ctrl.favoritePairs = [{
        //         //     priceAsset: ctrl.assetsList[0],
        //         //     amountAsset: ctrl.assetsList[1]
        //         // }];
        //     });

        ctrl.addFavorite = function () {};
        ctrl.showMoreTraded = function () {};

        ctrl.buyOrders = getOrdersFromBackend(1).map(normalizeOrder);
        ctrl.sellOrders = getOrdersFromBackend(-1).map(normalizeOrder);
        ctrl.userOrders = [];

        ctrl.createOrder = function (type, price, amount) {
            dexOrderService.addOrder({
                amountAssetId: ctrl.pair.amountAsset.id,
                priceAssetId: ctrl.pair.priceAsset.id
            }, {
                orderType: type,
                price: Money.fromTokens(price, ctrl.pair.priceAsset),
                amount: Money.fromTokens(amount, ctrl.pair.amountAsset),
                fee: Money.fromTokens(0.01, Currency.WAV)
            }, {
                publicKey: applicationContext.account.keyPair.public,
                privateKey: applicationContext.account.keyPair.private
            });
        };

        ctrl.changePair = function () {
            // TODO
        };
    }

    DexController.$inject = ['$scope', 'applicationContext', 'assetStoreFactory',
                            'dexOrderService', 'dexOrderbookService'];

    angular
        .module('app.dex')
        .component('wavesDex', {
            controller: DexController,
            templateUrl: 'dex/component'
        });
})();

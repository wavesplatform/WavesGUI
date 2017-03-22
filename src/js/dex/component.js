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

    function DexController($scope, applicationContext, assetStoreFactory) {
        var ctrl = this;

        var assetStore = assetStoreFactory.createStore(applicationContext.account.address);

        // Real pair which is always in the right order (price/amount).
        ctrl.currentPair = {
            priceAsset: null,
            amountAsset: null
        };

        ctrl.orderbook = null;

        Promise.resolve()
            .then(assetStore.getAll.bind(assetStore))
            .then(function (assetsList) {
                $scope.$apply(function () {
                    ctrl.assetsList = assetsList;
                    ctrl.currentPair.priceAsset = assetsList[0];
                    ctrl.currentPair.amountAsset = assetsList[1];
                    ctrl.favoritePairs = [{
                        priceAsset: ctrl.assetsList[0],
                        amountAsset: ctrl.assetsList[1]
                    }];
                    ctrl.tradedPairs = [{
                        priceAsset: ctrl.assetsList[0],
                        amountAsset: ctrl.assetsList[1]
                    }];
                });
            });

        ctrl.addFavorite = function () {};
        ctrl.showMoreTraded = function () {};

        ctrl.buyOrders = getOrdersFromBackend(1).map(normalizeOrder);
        ctrl.sellOrders = getOrdersFromBackend(-1).map(normalizeOrder);
        ctrl.userOrders = [];

        ctrl.changePair = function () {
            var temp = ctrl.currentPair.priceAsset;
            ctrl.currentPair.priceAsset = ctrl.currentPair.amountAsset;
            ctrl.currentPair.amountAsset = temp;
        };
    }

    DexController.$inject = ['$scope', 'applicationContext', 'assetStoreFactory'];

    angular
        .module('app.dex')
        .component('wavesDex', {
            controller: DexController,
            templateUrl: 'dex/component'
        });
})();

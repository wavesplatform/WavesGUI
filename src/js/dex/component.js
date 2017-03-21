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

    function DexController($scope, applicationContext, apiService, assetStoreService) {
        var ctrl = this;

        // Unfiltered list for keeping user assets and hardcoded ones.
        // TODO : implement a filtered array to pass to asset picker components.
        ctrl.assetsList = [];

        // Real pair which is always in the right order (price/amount).
        ctrl.currentPair = {
            priceAsset: null,
            amountAsset: null
        };

        Promise.resolve()
            .then(getUserBalances) // Get both Waves and asset balances in one array.
            .then(assetStoreService.complement) // Add needed fields and missing assets.
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

        function getUserBalances() {
            var balances = [];
            return Promise.resolve()
                .then(apiService.assets.balance.bind(apiService.assets, applicationContext.account.address))
                .then(function (response) {
                    balances = response.balances.map(function (item) {
                        return {
                            assetId: item.assetId,
                            balance: item.balance,
                            decimals: item.issueTransaction.decimals,
                            displayName: item.issueTransaction.name
                        };
                    });
                })
                .then(apiService.address.balance.bind(apiService.assets, applicationContext.account.address))
                .then(function (response) {
                    balances.unshift({
                        balance: normalizeBalance(response.balance),
                        decimals: 8,
                        displayName: 'Waves'
                    });
                    return Promise.resolve(balances);
                });
        }
    }

    DexController.$inject = ['$scope', 'applicationContext', 'apiService', 'assetStoreService'];

    angular
        .module('app.dex')
        .component('wavesDex', {
            controller: DexController,
            templateUrl: 'dex/component'
        });
})();

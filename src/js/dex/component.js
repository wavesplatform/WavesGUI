(function () {
    'use strict';

    function getPairIds(pair) {
        return {
            amountAssetId: pair.amountAsset.id,
            priceAssetId: pair.priceAsset.id
        };
    }

    function DexController($scope, applicationContext, assetStoreFactory,
                           dexOrderService, dexOrderbookService, notificationService) {
        var ctrl = this,

            assetStore = assetStoreFactory.createStore(applicationContext.account.address),

            initialAssetOne = Currency.WAV,
            initialAssetTwo = new Currency({
                id: '3K8EjNoBvQjGT7MDhsKdKcayAKmWjxtEWEwAVeQzFGHu',
                displayName: 'DOCoin',
                precision: 4
            });

        function refreshUserOrders() {
            dexOrderService
                .getOrders(getPairIds(ctrl.pair))
                .then(function (orders) {
                    ctrl.userOrders = orders;
                });
        }

        assetStore
            .getAll()
            .then(function (assetsList) {
                // $scope.$apply(function () {
                ctrl.assetsList = assetsList;
                // });
            })
            .then(function () {
                return dexOrderbookService.switchToPair(initialAssetOne, initialAssetTwo);
            })
            .then(function (orderbook) {
                // $scope.$apply(function () {
                ctrl.pair = {
                    priceAsset: assetStore.syncGetAsset(orderbook.pair.priceAsset),
                    amountAsset: assetStore.syncGetAsset(orderbook.pair.amountAsset)
                };

                // // TODO : normalize them all inside the service.
                ctrl.buyOrders = orderbook.bids;
                ctrl.sellOrders = orderbook.asks;
                refreshUserOrders();
                $scope.$apply();
                // ctrl.userOrders = dexOrderService.getOrders(ctrl.pair);
                // });
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

        ctrl.buyOrders = [];
        ctrl.sellOrders = [];
        ctrl.userOrders = [];

        ctrl.createOrder = function (type, price, amount) {
            dexOrderService.addOrder(getPairIds(ctrl.pair), {
                orderType: type,
                price: Money.fromTokens(price, ctrl.pair.priceAsset),
                amount: Money.fromTokens(amount, ctrl.pair.amountAsset),
                fee: Money.fromTokens(0.01, Currency.WAV)
            }, {
                publicKey: applicationContext.account.keyPair.public,
                privateKey: applicationContext.account.keyPair.private
            }).then(function () {
                refreshUserOrders();
                notificationService.notice('The order has been created!');
            }).catch(function (e) {
                notificationService.error('The order has not been created!');
            });
        };

        ctrl.changePair = function () {
            // TODO
        };
    }

    DexController.$inject = ['$scope', 'applicationContext', 'assetStoreFactory',
                            'dexOrderService', 'dexOrderbookService', 'notificationService'];

    angular
        .module('app.dex')
        .component('wavesDex', {
            controller: DexController,
            templateUrl: 'dex/component'
        });
})();

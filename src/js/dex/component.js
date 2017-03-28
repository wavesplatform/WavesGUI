(function () {
    'use strict';

    function getPairIds(pair) {
        return {
            amountAssetId: pair.amountAsset.id,
            priceAssetId: pair.priceAsset.id
        };
    }

    function DexController($scope, $interval, applicationContext, assetStoreFactory,
                           dexOrderService, dexOrderbookService, notificationService) {
        var ctrl = this,

            sender = {
                publicKey: applicationContext.account.keyPair.public,
                privateKey: applicationContext.account.keyPair.private
            },

            assetStore = assetStoreFactory.createStore(applicationContext.account.address),

            initialAssetOne = Currency.WAV,
            initialAssetTwo = new Currency({
                id: '3K8EjNoBvQjGT7MDhsKdKcayAKmWjxtEWEwAVeQzFGHu',
                displayName: 'DOCoin',
                precision: 4
            });

        ctrl.addFavorite = function () {};
        ctrl.showMoreTraded = function () {};

        ctrl.buyOrders = [];
        ctrl.sellOrders = [];
        ctrl.userOrders = [];

        assetStore.getAll()
            .then(function (assetsList) {
                $scope.$apply(function () {
                    ctrl.assetsList = assetsList;
                });
            })
            .then(function () {
                return dexOrderbookService.getOrderbook(initialAssetOne, initialAssetTwo);
            })
            .then(function (orderbook) {
                ctrl.pair = {
                    priceAsset: assetStore.syncGetAsset(orderbook.pair.priceAsset),
                    amountAsset: assetStore.syncGetAsset(orderbook.pair.amountAsset)
                };

                ctrl.buyOrders = orderbook.bids;
                ctrl.sellOrders = orderbook.asks;
                refreshUserOrders();
                $scope.$apply();
            });

        $interval(function () {
            refreshOrderbooks();
            refreshUserOrders();
        }, 5000);

        // favoritePairsService.getAll()
        //     .then(function () {
        //         // ctrl.favoritePairs = [{
        //         //     priceAsset: ctrl.assetsList[0],
        //         //     amountAsset: ctrl.assetsList[1]
        //         // }];
        //     });

        ctrl.createOrder = function (type, price, amount) {
            dexOrderService
                .addOrder(getPairIds(ctrl.pair), {
                    orderType: type,
                    price: Money.fromTokens(price, ctrl.pair.priceAsset),
                    amount: Money.fromTokens(amount, ctrl.pair.amountAsset),
                    fee: Money.fromTokens(0.01, Currency.WAV)
                }, sender)
                .then(function () {
                    refreshOrderbooks();
                    refreshUserOrders();
                    notificationService.notice('Order has been created!');
                }).catch(function () {
                    notificationService.error('Order has not been created!');
                });
        };

        ctrl.cancelOrder = function (order) {
            dexOrderService
                .removeOrder(getPairIds(ctrl.pair), order, sender)
                .then(function () {
                    refreshOrderbooks();
                    refreshUserOrders();
                    notificationService.notice('Order has been cancelled!');
                }).catch(function () {
                    notificationService.error('Order could not be cancelled!');
                });
        };

        ctrl.changePair = function () {
            // TODO
        };

        function refreshOrderbooks() {
            dexOrderbookService
                .getOrderbook(ctrl.pair.priceAsset, ctrl.pair.amountAsset)
                .then(function (orderbook) {
                    ctrl.buyOrders = orderbook.bids;
                    ctrl.sellOrders = orderbook.asks;
                });
        }

        function refreshUserOrders() {
            dexOrderService
                .getOrders(getPairIds(ctrl.pair))
                .then(function (orders) {
                    ctrl.userOrders = orders;
                });
        }
    }

    DexController.$inject = ['$scope', '$interval', 'applicationContext', 'assetStoreFactory',
                            'dexOrderService', 'dexOrderbookService', 'notificationService'];

    angular
        .module('app.dex')
        .component('wavesDex', {
            controller: DexController,
            templateUrl: 'dex/component'
        });
})();

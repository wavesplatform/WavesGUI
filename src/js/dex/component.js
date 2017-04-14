(function () {
    'use strict';

    var POLLING_DELAY = 5000;

    function getPairIds(pair) {
        return {
            amountAssetId: pair.amountAsset.id,
            priceAssetId: pair.priceAsset.id
        };
    }

    function DexController($scope, $interval, applicationContext, assetStoreFactory,
                           dexOrderService, dexOrderbookService, notificationService) {
        var ctrl = this,
            intervalPromise,

            // TODO : inside the store, get the markets from matcher.
            // assetStore = assetStoreFactory.createStore({
            //     address: applicationContext.account.address,
            //     markets: true
            // }),

            assetStore = assetStoreFactory.createStore(applicationContext.account.address),

            sender = {
                publicKey: applicationContext.account.keyPair.public,
                privateKey: applicationContext.account.keyPair.private
            };

        ctrl.assetsList = [];

        ctrl.pair = {
            amountAsset: Currency.WAV,
            priceAsset: Currency.BTC
        };

        ctrl.buyOrders = [];
        ctrl.sellOrders = [];
        ctrl.userOrders = [];

        ctrl.favoritePairs = [
            {amountAsset: Currency.WAV, priceAsset: Currency.BTC},
            {amountAsset: Currency.WAV, priceAsset: Currency.USD},
            {amountAsset: Currency.WAV, priceAsset: Currency.EUR},
            {amountAsset: Currency.WAV, priceAsset: Currency.CNY},
            {amountAsset: Currency.BTC, priceAsset: Currency.EUR},
            {amountAsset: Currency.BTC, priceAsset: Currency.CNY},
            {amountAsset: Currency.USD, priceAsset: Currency.BTC},
            {amountAsset: Currency.USD, priceAsset: Currency.CNY},
            {amountAsset: Currency.EUR, priceAsset: Currency.USD},
            {amountAsset: Currency.WCT, priceAsset: Currency.WAV},
            {amountAsset: Currency.WCT, priceAsset: Currency.BTC},
            {amountAsset: Currency.MRT, priceAsset: Currency.WAV},
            {amountAsset: Currency.MRT, priceAsset: Currency.BTC}
        ];

        ctrl.createOrder = function (type, price, amount, fee, callback) {
            // TODO : add a queue for the orders which weren't yet accepted.
            dexOrderService
                .addOrder(getPairIds(ctrl.pair), {
                    orderType: type,
                    amount: Money.fromTokens(amount, ctrl.pair.amountAsset),
                    price: OrderPrice.fromTokens(price, ctrl.pair),
                    fee: Money.fromTokens(fee, Currency.WAV)
                }, sender)
                .then(function () {
                    refreshOrderbooks();
                    refreshUserOrders();
                    notificationService.notice('Order has been created!');
                    if (callback) {
                        callback();
                    }
                })
                .catch(function (e) {
                    var errorMessage = e.data ? e.data.message : null;
                    notificationService.error(errorMessage || 'Order has not been created!');
                    if (callback) {
                        callback();
                    }
                });
        };

        ctrl.cancelOrder = function (order) {
            // TODO : add a queue for the orders which weren't yet canceled.
            dexOrderService
                .removeOrder(getPairIds(ctrl.pair), order, sender)
                .then(function () {
                    refreshOrderbooks();
                    refreshUserOrders();
                    notificationService.notice('Order has been canceled!');
                })
                .catch(function (exception) {
                    console.log(exception);
                    notificationService.error('Order could not be canceled!');
                });
        };

        ctrl.changePair = function (pair) {
            ctrl.pair = pair;
            refreshOrderbooks();
            refreshUserOrders();
        };

        assetStore.getAll()
            .then(function (assetsList) {
                // From here, asset pickers start working.
                ctrl.assetsList = assetsList;
                $scope.$apply();
            })
            .then(function () {
                return dexOrderbookService.getOrderbook(ctrl.pair.amountAsset, ctrl.pair.priceAsset);
            })
            .then(function (orderbook) {
                ctrl.pair = {
                    // Here we just get assets by their IDs.
                    amountAsset: assetStore.syncGetAsset(orderbook.pair.amountAsset),
                    priceAsset: assetStore.syncGetAsset(orderbook.pair.priceAsset)
                };

                ctrl.buyOrders = orderbook.bids;
                ctrl.sellOrders = orderbook.asks;
                refreshUserOrders();
                $scope.$apply();
            })
            .catch(function (e) {
                console.log(e);
            });

        // Events are from asset pickers.
        $scope.$on('asset-picked', function (e, newAsset, type) {
            // Define in which widget the asset was changed.
            ctrl.pair[type] = newAsset;
            refreshOrderbooks();
            refreshUserOrders();
        });

        // Enable polling.
        intervalPromise = $interval(function () {
            refreshOrderbooks();
            refreshUserOrders();
        }, POLLING_DELAY);

        ctrl.$onDestroy = function () {
            $interval.cancel(intervalPromise);
        };

        function refreshOrderbooks() {
            if (!ctrl.pair.amountAsset || !ctrl.pair.priceAsset) {
                return;
            }

            dexOrderbookService
                .getOrderbook(ctrl.pair.priceAsset, ctrl.pair.amountAsset)
                .then(function (orderbook) {
                    ctrl.buyOrders = orderbook.bids;
                    ctrl.sellOrders = orderbook.asks;
                    return orderbook.pair;
                })
                .then(function (pair) {
                    // Placing each asset in the right widget.
                    if (ctrl.pair.amountAsset.id !== pair.amountAsset && ctrl.pair.priceAsset.id !== pair.priceAsset) {
                        var temp = ctrl.pair.amountAsset;
                        ctrl.pair.amountAsset = ctrl.pair.priceAsset;
                        ctrl.pair.priceAsset = temp;
                    }
                })
                .catch(function (exception) {
                    console.log(exception);
                });
        }

        function refreshUserOrders() {
            if (!ctrl.pair.amountAsset || !ctrl.pair.priceAsset) {
                return;
            }

            dexOrderService
                .getOrders(getPairIds(ctrl.pair))
                .then(function (orders) {
                    // TODO : add here orders from pending queues.
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

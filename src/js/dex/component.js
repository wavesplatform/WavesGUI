(function () {
    'use strict';

    var POLLING_DELAY = 5000,
        HISTORY_LIMIT = 50;

    function DexController($scope, $interval, applicationContext, assetStoreFactory, datafeedApiService,
                           dexOrderService, dexOrderbookService, notificationService, utilsService, dialogService) {

        var ctrl = this,
            intervalPromise,

            assetStore = assetStoreFactory.createStore(applicationContext.account.address),

            sender = {
                publicKey: applicationContext.account.keyPair.public,
                privateKey: applicationContext.account.keyPair.private
            };

        ctrl.assetsList = [];

        ctrl.pair = {
            amountAsset: Currency.WAVES,
            priceAsset: Currency.BTC
        };

        emptyDataFields();

        var favoritePairs = [
            { amountAsset: Currency.WAVES, priceAsset: Currency.BTC },
            { amountAsset: Currency.WAVES, priceAsset: Currency.USD },
            { amountAsset: Currency.WAVES, priceAsset: Currency.EUR },
            { amountAsset: Currency.BTC, priceAsset: Currency.EUR },
            { amountAsset: Currency.BTC, priceAsset: Currency.USD },
            { amountAsset: Currency.ETH, priceAsset: Currency.WAVES },
            { amountAsset: Currency.ETH, priceAsset: Currency.BTC },
            { amountAsset: Currency.ETH, priceAsset: Currency.USD },
            { amountAsset: Currency.WCT, priceAsset: Currency.WAVES },
            { amountAsset: Currency.WCT, priceAsset: Currency.BTC },
            { amountAsset: Currency.MRT, priceAsset: Currency.WAVES },
            { amountAsset: Currency.MRT, priceAsset: Currency.BTC },
            { amountAsset: Currency.EUR, priceAsset: Currency.USD }
        ];

        // TODO : change after Dec 11, 2017
        if (Date.now() >= 1512993600000) {
            favoritePairs.push({
                amountAsset: Currency.WAVES,
                priceAsset: Currency.TRY
            });
        }

        ctrl.favoritePairs = favoritePairs;

        ctrl.createOrder = function (type, price, amount, fee, callback) {
            // TODO : add a queue for the orders which weren't yet accepted

            function emptyBadOrderFields() {
                ctrl.badOrderQuestion = '';
                ctrl.placeBadOrder = ctrl.refuseBadOrder = function () {};
            }

            var amountName = ctrl.pair.amountAsset.displayName,
                priceName = ctrl.pair.priceAsset.displayName,
                badSellOrder = (type === 'sell' && ctrl.buyOrders.length && price < ctrl.buyOrders[0].price * 0.9),
                badBuyOrder = (type === 'buy' && ctrl.sellOrders.length && price > ctrl.sellOrders[0].price * 1.1);

            if (badSellOrder || badBuyOrder) {

                ctrl.badOrderQuestion = 'Are you sure you want to ' + type + ' ' +
                    amountName + ' at price ' + price + ' ' + priceName + '?';

                ctrl.placeBadOrder = function () {
                    emptyBadOrderFields();
                    ctrl.realCreateOrder(type, price, amount, fee, callback);
                };

                ctrl.refuseBadOrder = function () {
                    emptyBadOrderFields();
                    callback();
                };

                dialogService.open('#dex-bad-order-confirmation');

            } else {
                ctrl.realCreateOrder(type, price, amount, fee, callback);
            }

        };

        ctrl.realCreateOrder = function (type, price, amount, fee, callback) {
            // TODO : add a queue for the orders which weren't yet accepted
            dexOrderService
                .addOrder(ctrl.pair, {
                    orderType: type,
                    amount: Money.fromTokens(amount, ctrl.pair.amountAsset),
                    price: OrderPrice.fromTokens(price, ctrl.pair),
                    fee: Money.fromTokens(fee, Currency.WAVES)
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
            // TODO : add a queue for the orders which weren't yet canceled

            // TODO : add different messages for cancel and delete actions
            dexOrderService
                .removeOrder(ctrl.pair, order, sender)
                .then(function () {
                    refreshOrderbooks();
                    refreshUserOrders();
                    notificationService.notice('Order has been canceled!');
                })
                .catch(function (e) {
                    console.log(e);
                    notificationService.error('Order could not be canceled!');
                });
        };

        ctrl.changePair = function (pair) {
            ctrl.pair = pair;
            emptyDataFields();
            refreshAll();
        };

        ctrl.fillBuyForm = fillBuyForm;

        ctrl.fillSellForm = fillSellForm;

        assetStore
            .getAll()
            .then(function (assetsList) {
                ctrl.assetsList = assetsList;
            })
            .then(function () {
                return dexOrderbookService.getOrderbook(ctrl.pair.amountAsset, ctrl.pair.priceAsset);
            })
            .then(function (orderbook) {
                ctrl.pair = {
                    // Here we just get assets by their IDs
                    amountAsset: assetStore.syncGetAsset(orderbook.pair.amountAsset),
                    priceAsset: assetStore.syncGetAsset(orderbook.pair.priceAsset)
                };

                ctrl.buyOrders = orderbook.bids;
                ctrl.sellOrders = orderbook.asks;
                refreshUserOrders();
                refreshTradeHistory();
            })
            .catch(function (e) {
                console.log(e);
            });

        // Events are from asset pickers
        $scope.$on('asset-picked', function (e, newAsset, type) {
            // Define in which widget the asset was changed
            ctrl.pair[type] = newAsset;
            emptyDataFields();
            refreshAll();
        });

        // Enable polling for orderbooks and newly created assets
        intervalPromise = $interval(function () {
            refreshAll();
        }, POLLING_DELAY);

        ctrl.$onDestroy = function () {
            $interval.cancel(intervalPromise);
        };

        function emptyDataFields() {
            ctrl.buyOrders = [];
            ctrl.sellOrders = [];
            ctrl.userOrders = [];

            ctrl.buyFormValues = {};
            ctrl.sellFormValues = {};

            ctrl.tradeHistory = [];
            ctrl.lastTradePrice = 0;

            fillBuyForm();
            fillSellForm();

            // That forces children components to react on the pair change
            ctrl.pair = _.clone(ctrl.pair);
        }

        function refreshAll() {
            refreshOrderbooks();
            refreshUserOrders();
            refreshTradeHistory();
        }

        function refreshOrderbooks() {
            if (!ctrl.pair.amountAsset || !ctrl.pair.priceAsset) {
                return;
            }

            dexOrderbookService
                .getOrderbook(ctrl.pair.amountAsset, ctrl.pair.priceAsset)
                .then(function (orderbook) {
                    ctrl.buyOrders = orderbook.bids;
                    ctrl.sellOrders = orderbook.asks;
                    return orderbook.pair;
                })
                .then(function (pair) {
                    // Placing each asset in the right widget
                    if (ctrl.pair.amountAsset.id !== pair.amountAsset && ctrl.pair.priceAsset.id !== pair.priceAsset) {
                        var temp = ctrl.pair.amountAsset;
                        ctrl.pair.amountAsset = ctrl.pair.priceAsset;
                        ctrl.pair.priceAsset = temp;
                    }
                })
                .catch(function (e) {
                    console.log(e);
                });
        }

        function refreshUserOrders() {
            if (!ctrl.pair.amountAsset || !ctrl.pair.priceAsset) {
                return;
            }

            dexOrderService
                .getOrders(ctrl.pair)
                .then(function (orders) {
                    // TODO : add here orders from pending queues
                    ctrl.userOrders = orders;
                });
        }

        function refreshTradeHistory() {
            var pair = ctrl.pair;
            if (pair) {
                if (utilsService.isTestnet()) {
                    pair = utilsService.testnetSubstitutePair(pair);
                }

                datafeedApiService
                    .getTrades(pair, HISTORY_LIMIT)
                    .then(function (response) {
                        ctrl.tradeHistory = response.map(function (trade) {
                            return {
                                timestamp: trade.timestamp,
                                type: trade.type,
                                typeTitle: trade.type === 'buy' ? 'Buy' : 'Sell',
                                price: trade.price,
                                amount: trade.amount,
                                total: trade.price * trade.amount
                            };
                        });

                        ctrl.lastTradePrice = ctrl.tradeHistory[0].price;
                    });
            }
        }

        function fillBuyForm(price, amount, total) {
            ctrl.buyFormValues = {
                price: price,
                amount: amount,
                total: total
            };
        }

        function fillSellForm(price, amount, total) {
            ctrl.sellFormValues = {
                price: price,
                amount: amount,
                total: total
            };
        }
    }

    DexController.$inject = ['$scope', '$interval', 'applicationContext', 'assetStoreFactory', 'datafeedApiService',
        'dexOrderService', 'dexOrderbookService', 'notificationService', 'utilsService', 'dialogService'];

    angular
        .module('app.dex')
        .component('wavesDex', {
            controller: DexController,
            templateUrl: 'dex/component'
        });
})();

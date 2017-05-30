(function () {
    'use strict';

    var FEE = 0.003,
        BALANCE_UPDATE_DELAY = 5000;

    function OrderCreatorController($interval, applicationContext, matcherApiService) {

        var ctrl = this,
            intervalPromise;

        ctrl.buy = {
            price: '',
            amount: '',
            total: '',
            fee: FEE,
            blocked: false
        };

        ctrl.sell = {
            price: '',
            amount: '',
            total: '',
            fee: FEE,
            blocked: false
        };

        ctrl.submitBuyOrder = function () {
            if (!ctrl.buy.amount || !ctrl.buy.price) {
                return;
            }

            ctrl.buy.blocked = true;
            ctrl.submit('buy', ctrl.buy.price, ctrl.buy.amount, FEE, function () {
                ctrl.buy.blocked = false;
                refreshBalances();
            });
        };

        ctrl.submitSellOrder = function () {
            if (!ctrl.sell.amount || !ctrl.sell.price) {
                return;
            }

            ctrl.sell.blocked = true;
            ctrl.submit('sell', ctrl.sell.price, ctrl.sell.amount, FEE, function () {
                ctrl.sell.blocked = false;
                refreshBalances();
            });
        };

        // Those two methods are called to update `total` after user's input:

        ctrl.updateBuyTotal = function () {
            ctrl.buy.total = ctrl.buy.price * ctrl.buy.amount || '';
        };

        ctrl.updateSellTotal = function () {
            ctrl.sell.total = ctrl.sell.price * ctrl.sell.amount || '';
        };

        // Those two methods calculate the amount as current balance divided by last history price:

        ctrl.buyFullBalance = function () {
            var price = ctrl.buy.price || ctrl.lastPrice,
                balance = ctrl.priceAssetBalance.toTokens();

            if (price && balance) {
                ctrl.buy.price = price;
                ctrl.buy.amount = Money.fromTokens(balance / price, ctrl.pair.amountAsset).toTokens();
                ctrl.updateBuyTotal();
            }
        };

        ctrl.sellFullBalance = function () {
            var price = ctrl.sell.price || ctrl.lastPrice,
                balance = ctrl.amountAssetBalance.toTokens();

            if (price && balance) {
                ctrl.sell.price = price;
                ctrl.sell.amount = balance;
                ctrl.updateSellTotal();
            }
        };

        intervalPromise = $interval(refreshBalances, BALANCE_UPDATE_DELAY);

        ctrl.$onDestroy = function () {
            $interval.cancel(intervalPromise);
        };

        ctrl.$onChanges = function (changes) {
            refreshBalances();

            // Those lines write directly to the `total` field when it's calculated in an orderbook:

            if (changes.outerBuyValues) {
                ctrl.buy.price = ctrl.outerBuyValues.price || '';
                ctrl.buy.amount = ctrl.outerBuyValues.amount || '';
                ctrl.buy.total = ctrl.outerBuyValues.total || ctrl.buy.price * ctrl.buy.amount || '';
            }

            if (changes.outerSellValues) {
                ctrl.sell.price = ctrl.outerSellValues.price || '';
                ctrl.sell.amount = ctrl.outerSellValues.amount || '';
                ctrl.sell.total = ctrl.outerSellValues.total || ctrl.sell.price * ctrl.sell.amount || '';
            }
        };

        function refreshBalances() {
            var amountAsset = ctrl.pair.amountAsset,
                priceAsset = ctrl.pair.priceAsset;

            matcherApiService
                .getTradableBalance(amountAsset.id, priceAsset.id, applicationContext.account.address)
                .then(function (data) {
                    ctrl.amountAssetBalance = Money.fromCoins(data[amountAsset.id], amountAsset);
                    ctrl.priceAssetBalance = Money.fromCoins(data[priceAsset.id], priceAsset);
                });
        }
    }

    OrderCreatorController.$inject = ['$interval', 'applicationContext', 'matcherApiService'];

    angular
        .module('app.dex')
        .component('wavesDexOrderCreator', {
            controller: OrderCreatorController,
            bindings: {
                pair: '<',
                submit: '<',
                lastPrice: '<',
                outerBuyValues: '<buyValues',
                outerSellValues: '<sellValues'
            },
            templateUrl: 'dex/order.creator.component'
        });
})();

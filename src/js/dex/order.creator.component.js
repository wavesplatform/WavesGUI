(function () {
    'use strict';

    var FEE = 0.003;

    function OrderCreatorController($interval, applicationContext, assetStoreFactory) {

        var ctrl = this,
            assetStore = assetStoreFactory.createStore(applicationContext.account.address),
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
            });
        };

        ctrl.submitSellOrder = function () {
            if (!ctrl.sell.amount || !ctrl.sell.price) {
                return;
            }

            ctrl.sell.blocked = true;
            ctrl.submit('sell', ctrl.sell.price, ctrl.sell.amount, FEE, function () {
                ctrl.sell.blocked = false;
            });
        };

        // Those two methods are called to update `total` after user's input:

        ctrl.updateBuyTotal = function () {
            ctrl.buy.total = ctrl.buy.price * ctrl.buy.amount || '';
        };

        ctrl.updateSellTotal = function () {
            ctrl.sell.total = ctrl.sell.price * ctrl.sell.amount || '';
        };

        intervalPromise = $interval(refreshBalances, 3000);

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
            ctrl.amountAssetBalance = assetStore.syncGetBalance(ctrl.pair.amountAsset.id);
            ctrl.priceAssetBalance = assetStore.syncGetBalance(ctrl.pair.priceAsset.id);
        }
    }

    OrderCreatorController.$inject = ['$interval', 'applicationContext', 'assetStoreFactory'];

    angular
        .module('app.dex')
        .component('wavesDexOrderCreator', {
            controller: OrderCreatorController,
            bindings: {
                pair: '<',
                submit: '<',
                outerBuyValues: '<buyValues',
                outerSellValues: '<sellValues'
            },
            templateUrl: 'dex/order.creator.component'
        });
})();

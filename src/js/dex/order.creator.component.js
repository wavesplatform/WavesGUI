(function () {
    'use strict';

    var FEE = 0.003;

    function OrderCreatorController(applicationContext, assetStoreFactory) {

        var ctrl = this,
            assetStore = assetStoreFactory.createStore(applicationContext.account.address);

        ctrl.buy = {
            amount: '',
            price: '',
            fee: FEE,
            blocked: false
        };

        ctrl.sell = {
            amount: '',
            price: '',
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

        ctrl.$onChanges = function () {
            ctrl.amountAssetBalance = assetStore.syncGetBalance(ctrl.pair.amountAsset.id);
            ctrl.priceAssetBalance = assetStore.syncGetBalance(ctrl.pair.priceAsset.id);
        };
    }

    OrderCreatorController.$inject = ['applicationContext', 'assetStoreFactory'];

    angular
        .module('app.dex')
        .component('wavesDexOrderCreator', {
            controller: OrderCreatorController,
            bindings: {
                pair: '<',
                submit: '<'
            },
            templateUrl: 'dex/order.creator.component'
        });
})();

(function () {
    'use strict';

    function OrderCreatorController() {

        var ctrl = this;

        ctrl.focused = 'buy';

        ctrl.buy = {
            amount: '',
            price: '',
            fee: 0.001
        };

        ctrl.sell = {
            amount: '',
            price: '',
            fee: 0.001
        };

        ctrl.focusOn = function (half) {
            ctrl.focused = half;
        };

        ctrl.submitBuyOrder = function () {
            ctrl.submit('buy', ctrl.buy.price, ctrl.buy.amount);
        };

        ctrl.submitSellOrder = function () {
            ctrl.submit('sell', ctrl.sell.price, ctrl.sell.amount);
        };
    }

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

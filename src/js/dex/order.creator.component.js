(function () {
    'use strict';

    function OrderCreatorController() {

        var ctrl = this;

        ctrl.focused = 'buy';

        ctrl.buy = {
            amount: '',
            price: '',
            fee: 0.001,
            blocked: false
        };

        ctrl.sell = {
            amount: '',
            price: '',
            fee: 0.001,
            blocked: false
        };

        ctrl.focusOn = function (half) {
            ctrl.focused = half;
        };

        ctrl.submitBuyOrder = function () {
            ctrl.buy.blocked = true;
            ctrl.submit('buy', ctrl.buy.price, ctrl.buy.amount, function () {
                ctrl.buy.blocked = false;
            });
        };

        ctrl.submitSellOrder = function () {
            ctrl.sell.blocked = true;
            ctrl.submit('sell', ctrl.sell.price, ctrl.sell.amount, function () {
                ctrl.sell.blocked = false;
            });
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
